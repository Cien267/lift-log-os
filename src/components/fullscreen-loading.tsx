import { Loader2 } from "lucide-react";

interface FullscreenLoadingProps {
  title?: string;
  description?: string;
}

export function FullscreenLoading({ title, description }: FullscreenLoadingProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="full-screen-loader">
          <div className="box">
            <div className="logo">FORGE</div>
          </div>
          <div className="box"></div>
          <div className="box"></div>
          <div className="box"></div>
          <div className="box"></div>
        </div>

        <div className="space-y-1 text-center">
          <p className="text-sm font-medium">{title}</p>

          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
}
