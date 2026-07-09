import { Skeleton } from "@/components/ui/skeleton";

export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block bg-card rounded-lg shadow-sm border border-border overflow-hidden mx-auto" style={{ maxWidth: "95%" }}>
        <div className="table-wrap">
          <table className="product-table w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4" style={{ width: "150px" }}><Skeleton className="h-4 w-20" /></th>
                <th className="p-4" style={{ width: "70px" }}><Skeleton className="h-4 w-8 mx-auto" /></th>
                <th className="p-4" style={{ width: "120px" }}><Skeleton className="h-4 w-16 mx-auto" /></th>
                <th className="p-4"><Skeleton className="h-4 w-32" /></th>
                <th className="p-4" style={{ width: "120px" }}><Skeleton className="h-4 w-16 mx-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {i === 0 && (
                    <td rowSpan={5} className="p-4 align-top border-r border-border bg-muted/20">
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                  )}
                  <td className="p-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-16 w-16 rounded-md mx-auto" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                  </td>
                  <td className="p-4 text-center">
                    <Skeleton className="h-8 w-20 rounded-md mx-auto mb-2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border overflow-hidden shadow-sm flex flex-col">
            <div className="flex bg-muted/20 px-3 py-2 items-center gap-2 border-b border-border">
              <Skeleton className="h-4 w-24" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
            <div className="p-4 flex gap-4">
              <Skeleton className="w-24 h-24 rounded-md flex-shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-5/6 mb-4" />
                <Skeleton className="h-8 w-full mt-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
