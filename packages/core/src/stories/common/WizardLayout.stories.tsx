import React from 'react';
import { useForm } from 'react-hook-form';

import { Meta, StoryObj } from '@storybook/react';

import { BooleanField, TextField } from '../../../../form-renderer/src/components/fields';
import { WizardLayout, WizardStep } from '../../components/Common/WizardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const meta = {
  title: 'Core/Common/WizardLayout',
  component: WizardLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WizardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Define some mock content for each step
const Step1Content: React.FC = () => {
  const form = useForm();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Personal Information</h2>
      <p className="text-muted-foreground">
        Please provide your basic personal information to get started.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="first-name"
          label="First Name"
          placeholder="Enter your first name"
          control={form.control}
          name="firstName"
        />
        <TextField
          id="last-name"
          label="Last Name"
          placeholder="Enter your last name"
          control={form.control}
          name="lastName"
        />
        <TextField
          id="email"
          label="Email Address"
          placeholder="Enter your email"
          control={form.control}
          name="email"
        />
        <TextField
          id="phone"
          label="Phone Number"
          placeholder="Enter your phone number"
          control={form.control}
          name="phone"
        />
      </div>
    </div>
  );
};

const Step2Content: React.FC = () => {
  const form = useForm();
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select a Plan</h2>
      <p className="text-muted-foreground">Choose the plan that best fits your needs.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-primary cursor-pointer">
          <CardHeader>
            <CardTitle>Basic Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $9<span className="text-muted-foreground text-sm font-normal">/month</span>
            </p>
            <ul className="mt-4 space-y-2">
              <li>• Feature 1</li>
              <li>• Feature 2</li>
              <li>• Feature 3</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $19<span className="text-muted-foreground text-sm font-normal">/month</span>
            </p>
            <ul className="mt-4 space-y-2">
              <li>• Feature 1</li>
              <li>• Feature 2</li>
              <li>• Feature 3</li>
              <li>• Feature 4</li>
              <li>• Feature 5</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <BooleanField
          id="terms"
          label="I agree to the terms and conditions"
          control={form.control}
          name="terms"
        />
      </div>
    </div>
  );
};

const Step3Content: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Review & Submit</h2>
      <p className="text-muted-foreground">Please review your information before submitting.</p>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Personal Information</h3>
            <dl className="mt-2 space-y-1">
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Name:</dt>
                <dd className="col-span-2">John Doe</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Email:</dt>
                <dd className="col-span-2">john@example.com</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Phone:</dt>
                <dd className="col-span-2">+1 (555) 123-4567</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="font-semibold">Selected Plan</h3>
            <dl className="mt-2 space-y-1">
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Plan:</dt>
                <dd className="col-span-2">Basic Plan</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Price:</dt>
                <dd className="col-span-2">$9/month</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-muted-foreground">Billing:</dt>
                <dd className="col-span-2">Monthly</dd>
              </div>
            </dl>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">
              By clicking submit, you agree to our terms of service and privacy policy. Your
              subscription will begin immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Create steps with components for the story
const stepsWithComponents: WizardStep[] = [
  {
    id: 'step-1',
    title: 'Step 1',
    component: <Step1Content />,
  },
  {
    id: 'step-2',
    title: 'Step 2',
    component: <Step2Content />,
  },
  {
    id: 'step-3',
    title: 'Step 3',
    component: <Step3Content />,
  },
];

export const Default: Story = {
  args: {
    steps: stepsWithComponents,
    onComplete: () => alert('Wizard completed!'),
  },
};

// Create a simplified version of steps for the InCard example
const simpleSteps: WizardStep[] = [
  {
    id: 'step-1',
    title: 'First Step',
    component: <div className="py-4">This is the content for step 1.</div>,
  },
  {
    id: 'step-2',
    title: 'Second Step',
    component: <div className="py-4">This is the content for step 2.</div>,
  },
  {
    id: 'step-3',
    title: 'Final Step',
    component: <div className="py-4">This is the content for the final step.</div>,
  },
];

export const InCard: Story = {
  args: {
    // These args are required by the type system but will be overridden in the render function
    steps: simpleSteps,
    onComplete: () => alert('Wizard in card completed!'),
  },
  parameters: {
    layout: 'centered',
  },
  render: () => (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Wizard Example</CardTitle>
      </CardHeader>
      <CardContent>
        <WizardLayout steps={simpleSteps} onComplete={() => alert('Wizard in card completed!')} />
      </CardContent>
    </Card>
  ),
};
