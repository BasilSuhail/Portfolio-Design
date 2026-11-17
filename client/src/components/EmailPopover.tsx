import { useEffect, useRef, useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmailPopoverProps {
  email: string;
  /** The icon slides in and out of the bar; hidden means it takes no space and cannot be reached. */
  visible: boolean;
}

const CLOSE_DELAY_MS = 180;
const COPIED_MS = 2000;

/**
 * Mail icon that sits with the social icons in the navigation bar. Hovering shows the address
 * in a small glass pill; clicking the icon (or the pill's Copy button) puts it on the clipboard.
 */
export function EmailPopover({ email, visible }: EmailPopoverProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      clearTimeout(copiedTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // The browser refused clipboard access. The address is still on screen to select by hand.
    }
  };

  // Hover only applies to a mouse; on touch the tap itself opens the pill.
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <span
      className={`flex justify-end transition-all duration-500 ease-out ${
        visible ? "w-4 opacity-100 scale-100" : "pointer-events-none -me-3 w-0 opacity-0 scale-50"
      }`}
      aria-hidden={!visible}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          asChild
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          onClick={(e) => {
            // Keep the pill open on click instead of toggling it, and copy straight away.
            e.preventDefault();
            clearTimeout(closeTimer.current);
            setOpen(true);
            void copy();
          }}
        >
          <button
            type="button"
            className="inline-flex shrink-0 text-[#EA4335] transition-colors hover:text-[#c5221f] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-sm dark:hover:text-[#ff7b6e]"
            aria-label="Show and copy email address"
            tabIndex={visible ? 0 : -1}
            data-testid="button-nav-email"
          >
            <Mail className="size-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={30}
          onPointerEnter={hoverOpen}
          onPointerLeave={hoverClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="glass-bar flex w-auto max-w-[calc(100vw-1rem)] items-center gap-2 rounded-full p-1.5 ps-5 text-sm"
          data-testid="popover-nav-email"
        >
          <span className="min-w-0 select-all truncate font-medium text-gray-800 dark:text-neutral-200">{email}</span>
          <span className="ms-1 h-4 w-px shrink-0 bg-black/10 dark:bg-white/15" aria-hidden="true" />
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-600 dark:text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </button>
          <span role="status" className="sr-only">
            {copied ? "Email address copied" : ""}
          </span>
        </PopoverContent>
      </Popover>
    </span>
  );
}
