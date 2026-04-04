import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  helperText,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium tracking-[0.02em] text-foreground/80">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs leading-5 text-destructive">{error}</p> : null}
      {!error && helperText ? <p className="text-xs leading-5 text-muted-foreground">{helperText}</p> : null}
    </div>
  );
}
