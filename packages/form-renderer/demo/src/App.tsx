import { FieldType, RenderFormSchema, TransactionForm } from '../../src';

import AddressFieldDemo from './AddressField.demo';
import NumberFieldDemo from './NumberField.demo';
import TextFieldDemo from './TextField.demo';

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
      type: 'text' as FieldType,
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
      type: 'text' as FieldType,
      placeholder: '0.0',
      helperText: 'Enter a numeric value',
      validation: {
        required: true,
        min: 0,
      },
    },
  ],
  layout: {
    columns: 1,
    spacing: 'normal',
    labelPosition: 'top',
  },
  validation: {
    mode: 'onBlur',
    showErrors: 'both',
  },
  submitButton: {
    text: 'Submit Transaction',
    loadingText: 'Processing...',
    variant: 'primary',
  },
};

// Sample adapter for demonstration
const sampleAdapter = {
  formatTransactionData: (
    functionId: string,
    inputs: Record<string, unknown>
  ): Record<string, unknown> => {
    console.log('Formatting transaction data', functionId, inputs);
    return { functionId, inputs };
  },
  isValidAddress: (address: string): boolean => {
    return address.startsWith('0x') && address.length === 42;
  },
};

export default function App(): React.ReactElement {
  const handleSubmit = (data: unknown): Promise<{ success: boolean }> => {
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
        <div className="space-y-12">
          {/* TextField Demo Section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">TextField Component Demo</h2>
              <p className="text-muted-foreground text-sm">
                Testing our TextField component with React Hook Form integration
              </p>
            </div>

            <div className="bg-background rounded-md border">
              <TextFieldDemo />
            </div>
          </section>

          {/* NumberField Demo Section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">NumberField Component Demo</h2>
              <p className="text-muted-foreground text-sm">
                Testing our NumberField component with React Hook Form integration
              </p>
            </div>

            <div className="bg-background rounded-md border">
              <NumberFieldDemo />
            </div>
          </section>

          {/* AddressField Demo Section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">AddressField Component Demo</h2>
              <p className="text-muted-foreground text-sm">
                Testing our AddressField component with React Hook Form integration
              </p>
            </div>

            <div className="bg-background rounded-md border">
              <AddressFieldDemo />
            </div>
          </section>

          {/* Transaction Form Section */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Transaction Form</h2>
              <p className="text-muted-foreground text-sm">
                Sample form components with Tailwind CSS styling
              </p>
            </div>

            <div className="bg-background rounded-md border p-4">
              <TransactionForm
                schema={sampleSchema}
                adapter={sampleAdapter}
                onSubmit={handleSubmit}
              />
            </div>
          </section>
        </div>
      </main>

      <footer>
        <p>Transaction Form Builder &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
