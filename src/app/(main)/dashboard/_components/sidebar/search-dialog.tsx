"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Keyboard shortcut ⌘J / Ctrl+J
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function handleSelect(url: string) {
    setOpen(false);
    router.push(url);
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-48 justify-between gap-2 px-3 text-sm text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5" />
          Cari halaman...
        </span>
        <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari halaman..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          {sidebarItems.map((group, gi) => {
            // Kumpulkan semua item (termasuk subItems) dari grup ini
            const flatItems: {
              title: string;
              url: string;
              groupLabel: string;
              disabled?: boolean;
            }[] = [];

            for (const item of group.items) {
              if (item.subItems?.length) {
                for (const sub of item.subItems) {
                  flatItems.push({
                    title: sub.title,
                    url: sub.url,
                    groupLabel: group.label ?? item.title,
                    disabled: sub.comingSoon,
                  });
                }
              } else {
                flatItems.push({
                  title: item.title,
                  url: item.url,
                  groupLabel: group.label ?? "Menu",
                  disabled: item.comingSoon,
                });
              }
            }

            if (!flatItems.length) return null;

            return (
              <React.Fragment key={group.id}>
                {gi !== 0 && <CommandSeparator />}
                <CommandGroup heading={group.label ?? "Menu"}>
                  {flatItems.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={item.title}
                      disabled={item.disabled}
                      onSelect={() => !item.disabled && handleSelect(item.url)}
                      className="gap-2"
                    >
                      <span>{item.title}</span>
                      {item.disabled && (
                        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
  