#!/usr/bin/env python3
"""AI Wonderland: one-epoch Qwen2.5-Coder 1.5B LoRA training on a CUDA GPU.

Run next to ai_wonderland_train.jsonl and ai_wonderland_eval.jsonl.
Requires a supported CUDA environment with unsloth, trl, datasets, torch.
This is a starter experiment, NOT production model quality certification.
"""
from pathlib import Path
import json
import torch

HERE = Path(__file__).resolve().parent
TRAIN = HERE / "ai_wonderland_train.jsonl"
EVAL = HERE / "ai_wonderland_eval.jsonl"
OUT = HERE / "outputs" / "ai-wonderland-qwen2.5-coder-lora"

def validate(path):
    if not path.is_file():
        raise SystemExit(f"Missing file: {path}")
    n = 0
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            msgs = item["messages"]
            assert len(msgs) >= 2
            assert all(m.get("role") in ("system", "user", "assistant")
                       and isinstance(m.get("content"), str) for m in msgs)
            assert any(m["role"] == "assistant" and m["content"].strip() for m in msgs)
        except (ValueError, TypeError, KeyError, AssertionError) as exc:
            raise SystemExit(f"{path.name}:{line_number} invalid: {exc}")
        n += 1
    if n == 0:
        raise SystemExit(f"{path} is empty")
    print(f"Validated {n} records: {path.name}")

if __name__ == "__main__":
    validate(TRAIN)
    validate(EVAL)
    if not torch.cuda.is_available():
        raise SystemExit("CUDA GPU not available here. Do not attempt fine-tuning on the CPU-only HP laptop.")
    print("GPU:", torch.cuda.get_device_name(0))

    # Import Unsloth before TRL/Transformers in CUDA training processes.
    from unsloth import FastLanguageModel, is_bfloat16_supported
    from unsloth.chat_templates import get_chat_template, train_on_responses_only
    from datasets import load_dataset
    from trl import SFTTrainer, SFTConfig

    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/Qwen2.5-Coder-1.5B-Instruct-bnb-4bit",
        max_seq_length=1024,
        dtype=None,
        load_in_4bit=True,
    )
    tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    ds = load_dataset("json", data_files={"train": str(TRAIN), "validation": str(EVAL)})
    def format_chats(examples):
        return {"text": [
            tokenizer.apply_chat_template(messages, tokenize=False,
                                          add_generation_prompt=False)
            for messages in examples["messages"]
        ]}
    ds = ds.map(format_chats, batched=True)
    for split in ("train", "validation"):
        if not ds[split][0]["text"].strip():
            raise SystemExit(f"Empty formatted example: {split}")

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=ds["train"],
        eval_dataset=ds["validation"],
        args=SFTConfig(
            output_dir=str(OUT),
            max_length=1024,
            dataset_text_field="text",
            num_train_epochs=1,
            per_device_train_batch_size=1,
            per_device_eval_batch_size=1,
            gradient_accumulation_steps=4,
            learning_rate=1e-4,
            warmup_steps=2,
            optim="adamw_8bit",
            bf16=is_bfloat16_supported(),
            fp16=not is_bfloat16_supported(),
            eval_strategy="epoch",
            save_strategy="epoch",
            logging_steps=1,
            report_to="none",
            packing=False,
            seed=3407,
        ),
    )
    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|im_start|>user\\n",
        response_part="<|im_start|>assistant\\n",
    )
    # Prevent silent training on a fully masked dataset.
    sample = trainer.train_dataset[0]
    labels = sample.get("labels", [])
    if not any(label != -100 for label in labels):
        raise SystemExit("No trainable assistant tokens remain; check the Qwen chat template.")

    print("Starting one-epoch pilot training. Adapter output:", OUT)
    result = trainer.train()
    print("Training loss:", result.training_loss)
    metrics = trainer.evaluate()
    print("Held-out evaluation:", metrics)
    adapter = OUT / "adapter"
    adapter.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(adapter))
    tokenizer.save_pretrained(str(adapter))
    print("LoRA adapter saved:", adapter)
