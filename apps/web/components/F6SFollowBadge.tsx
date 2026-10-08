/** Official F6S Follow badge shared across public-facing pages. */
export default function F6SFollowBadge() {
  return (
    <a
      href="https://www.f6s.com/member/michael-waite1?follow=1"
      target="_blank"
      rel="noopener noreferrer"
      title="Follow the AI WONDERLAND founder on F6S"
      aria-label="Follow the AI WONDERLAND founder on F6S (opens in a new tab)"
      className="inline-flex shrink-0 items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
    >
      <img
        src="https://www.f6s.com/images/f6s-follow-secondary.png"
        alt="Follow on F6S"
        width={78}
        height={22}
        loading="lazy"
        decoding="async"
        className="h-[22px] w-[78px]"
      />
    </a>
  );
}
