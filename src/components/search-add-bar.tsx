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
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
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
        className="h-10 w-10 rounded-full p-0 shrink-0 gradient-primary"
        disabled={addDisabled}
        aria-label={addLabel}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
