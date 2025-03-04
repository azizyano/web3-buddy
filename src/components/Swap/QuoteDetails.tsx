import { KyberQuote } from "@/types/type";

export const QuoteDetails = ({ quote }: { quote: KyberQuote }) => (
    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Swap Details</h3>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Expected Output:</span>
          <span>{quote.outputAmount}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Gas:</span>
          <span>{quote.gasEstimate} Gwei</span>
        </div>
        <div className="flex justify-between">
          <span>Route Steps:</span>
          <span>{quote.routeSummary.length}</span>
        </div>
      </div>
    </div>
  );