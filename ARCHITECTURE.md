# Psychic Octo-Fishstick Architecture

## Overview
This repository is a high-performance, AI-orchestrated development environment. We've moved past the legacy 'Theia' proxy and are fully committed to a Coder-based (code-server) sandbox architecture. 

## Core Components
- **AI Orchestrator**: Located in `engine/core/ai/`, this is the brain. It manages code generation, self-modification guards, and multi-engine coordination.
- **Multi-Engine Host**: Supports PlayCanvas, WebGLStudio, and Puck UI via `apps/web/components/engines/`.
- **Sovereign OS Context**: A React context providing 'OS-like' capabilities to the web interface.

## Deprecated Elements
- **_FALLBACK_VAULT**: (DELETED) Legacy Unreal-Wonder-Build assets have been purged. If you need them, check the git history. We don't store junk in the living room.
- **Theia**: Replaced by the `tenant-ide-proxy` and Coder.

## Artifact Management
- **attached_assets/**: This directory is for temporary build artifacts. It should not be used for persistent source storage. GLB files should be unzipped and moved to `apps/web/public/assets/` during the build pipeline.