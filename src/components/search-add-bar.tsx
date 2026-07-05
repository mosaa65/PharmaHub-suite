import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SearchAddBar({
  search,
  onSearchChange,
  onAdd,
  addLabel,
  placeholder,
  className,
  addDisabled,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
  placeholder: string;
  className?: string;
  addDisabled?: boolean;
}) {
  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-full ps-10"
        />
      </div>
      <Button
        onClick={onAdd}
        className="h-10 shrink-0 rounded-full px-3 sm:px-4 gap-2 gradient-primary"
        disabled={addDisabled}
        aria-label={addLabel}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{addLabel}</span>
      </Button>
    </div>
  );
}
