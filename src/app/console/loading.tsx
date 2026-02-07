import { Card } from "@/ui/primitives/card";
import { Skeleton } from "@/ui/primitives/skeleton";

const highlights = [0, 1, 2, 3];
const tiles = [0, 1, 2];

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card className="panel fade-rise p-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {highlights.map((item) => (
          <Card key={item} className="panel fade-rise p-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiles.map((item) => (
          <Card key={item} className="panel fade-rise p-4">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-3/5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
