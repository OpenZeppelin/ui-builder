/**
 * Form Placeholder Component
 *
 * This is a placeholder component that will be replaced with the generated form during export.
 * It demonstrates how the exported form will be structured and integrated with the form-renderer.
 *
 * During export, this will be replaced with a real implementation that uses the
 * @openzeppelin/transaction-form-builder-form-renderer package, which is the same
 * package used in the preview within the form builder tool.
 *
 * This approach ensures consistent behavior between preview and exported forms,
 * and allows for automatic updates when the form-renderer package is improved.
 */
export function FormPlaceholder() {
  return (
    <div className="form-placeholder">
      <h2>Transaction Form</h2>
      <p>This is a placeholder for the generated transaction form.</p>
      <p>When exported, this file will be replaced with a real implementation that:</p>
      <ul>
        <li>
          Imports the TransactionForm from @openzeppelin/transaction-form-builder-form-renderer
        </li>
        <li>Creates an instance of the appropriate blockchain adapter</li>
        <li>Loads the form schema generated during export</li>
        <li>Renders the form with proper validation and submission handling</li>
      </ul>

      <div className="form-example mt-6 rounded-md border p-4">
        <div className="mb-4">
          <label className="mb-1 block font-medium">Recipient Address</label>
          <input type="text" placeholder="0x..." className="w-full rounded-md border px-3 py-2" />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-medium">Amount</label>
          <input type="number" placeholder="0.0" className="w-full rounded-md border px-3 py-2" />
        </div>

        <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Submit Transaction
        </button>
      </div>

      <div className="mt-6 rounded-md border-l-4 border-blue-400 bg-blue-50 p-4 text-blue-700">
        <h3 className="font-medium">Developer Note</h3>
        <p className="mt-1 text-sm">
          The exported form uses the same form-renderer package as the builder tool, ensuring
          consistent behavior and enabling automatic updates when the package is improved or
          bug-fixed.
        </p>
      </div>
    </div>
  );
}
