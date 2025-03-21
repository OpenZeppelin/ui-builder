import { Meta, StoryObj } from '@storybook/react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { WizardLayout, WizardStep } from './WizardLayout';

const meta: Meta<typeof WizardLayout> = {
  title: 'Core/Common/WizardLayout',
  component: WizardLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WizardLayout>;

// Mock step components
const Step1 = () => (
  <div className="space-y-4">
    <p className="text-muted-foreground">
      Welcome to the wizard! Please fill out the following steps to complete the process.
    </p>
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label
        htmlFor="terms"
        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        I accept the terms and conditions
      </Label>
    </div>
  </div>
);

const Step2 = () => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Please enter your personal information.</p>
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
    </div>
  </div>
);

const Step3 = () => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Select your subscription plan.</p>
    <div className="grid gap-4">
      <Card className="border-primary cursor-pointer">
        <CardHeader>
          <CardTitle>Basic Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">$9.99/month</p>
          <p className="mt-2 text-sm">Includes basic features</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer">
        <CardHeader>
          <CardTitle>Pro Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">$19.99/month</p>
          <p className="mt-2 text-sm">Includes advanced features</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Step4 = () => (
  <div className="space-y-4">
    <p className="text-muted-foreground">Review and confirm your information.</p>
    <div className="bg-muted rounded-md p-4">
      <h3 className="mb-2 font-medium">Order Summary</h3>
      <div className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <span>Plan:</span>
          <span>Basic Plan</span>
        </div>
        <div className="flex justify-between">
          <span>Price:</span>
          <span>$9.99/month</span>
        </div>
        <div className="flex justify-between">
          <span>Billing:</span>
          <span>Monthly</span>
        </div>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="confirm" />
      <Label
        htmlFor="confirm"
        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        I confirm all information is correct
      </Label>
    </div>
  </div>
);

const steps: WizardStep[] = [
  {
    id: 'step-1',
    title: 'Start',
    component: <Step1 />,
  },
  {
    id: 'step-2',
    title: 'Personal Info',
    component: <Step2 />,
  },
  {
    id: 'step-3',
    title: 'Plan',
    component: <Step3 />,
  },
  {
    id: 'step-4',
    title: 'Review',
    component: <Step4 />,
  },
];

export const Default: Story = {
  render: () => (
    <div className="bg-background p-6">
      <div className="mx-auto w-full">
        <WizardLayout
          steps={steps}
          initialStep={0}
          onComplete={() => console.log('Wizard completed!')}
        />
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="bg-background p-6">
      <div className="mx-auto w-full max-w-5xl">
        <Card>
          <WizardLayout
            steps={steps}
            initialStep={0}
            onComplete={() => console.log('Wizard completed!')}
          />
        </Card>
      </div>
    </div>
  ),
};
