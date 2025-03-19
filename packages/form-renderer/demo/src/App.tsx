import { FieldType, RenderFormSchema, TransactionFormRenderer } from '../../src';

// Sample form schema for demonstration
const sampleSchema: RenderFormSchema = {
  id: 'demo-form',
  title: 'Demo Transaction Form',
  description: 'This is a sample form for demonstration purposes',
  fields: [
    {
      id: 'field1',
      name: 'sampleField',
      label: 'Sample Field',
      type: 'text' as FieldType,
      placeholder: 'Enter some text',
      helperText: 'This is a sample field',
      validation: {
        required: true,
      },
    },
    {
      id: 'field2',
      name: 'addressField',
      label: 'Address',
      type: 'address' as FieldType,
      placeholder: '0x...',
      helperText: 'Enter a valid Ethereum address',
      validation: {
        required: true,
      },
    },
    {
      id: 'field3',
      name: 'numberField',
      label: 'Amount',
      type: 'number' as FieldType,
      placeholder: '0.0',
      helperText: 'Enter a numeric value',
      validation: {
        required: true,
        min: 0,
      },
    },
  ],
  submitButton: {
    text: 'Submit Transaction',
    loadingText: 'Processing...',
  },
};

// Sample adapter for demonstration
const sampleAdapter = {
  formatTransactionData: (functionId: string, inputs: Record<string, unknown>) => {
    console.log('Formatting transaction data', functionId, inputs);
    return { functionId, inputs };
  },
  isValidAddress: (address: string) => {
    return address.startsWith('0x') && address.length === 42;
  },
};

export default function App() {
  const handleSubmit = (data: unknown) => {
    console.log('Form submitted with data:', data);
    return Promise.resolve({ success: true });
  };

  return (
    <div className="demo-container">
      <header>
        <h1>Form Renderer Demo</h1>
        <p>This demo showcases the form renderer component in action</p>
      </header>

      <main>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Transaction Form</h2>
            <p className="text-muted-foreground text-sm">
              Sample form components with Tailwind CSS styling
            </p>
          </div>

          <div className="bg-background rounded-md border p-4">
            <TransactionFormRenderer
              formSchema={sampleSchema}
              adapter={sampleAdapter}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>

      <footer>
        <p>Transaction Form Builder &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
