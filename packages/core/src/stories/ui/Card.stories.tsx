import { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../../../form-renderer/src/components/ui/button';
import { Input } from '../../../../form-renderer/src/components/ui/input';
import { Label } from '../../../../form-renderer/src/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

const meta = {
  title: 'Core/UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
};

export const LoginForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to sign in to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input id="password" type="password" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Sign In</Button>
      </CardFooter>
    </Card>
  ),
};

export const PricingCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>For business users and production use</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <span className="text-4xl font-bold">$19</span>
          <span className="text-muted-foreground text-sm font-normal">/month</span>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary mr-2 h-4 w-4"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Unlimited projects</span>
          </li>
          <li className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary mr-2 h-4 w-4"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Unlimited team members</span>
          </li>
          <li className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary mr-2 h-4 w-4"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span>Priority support</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Subscribe</Button>
      </CardFooter>
    </Card>
  ),
};
