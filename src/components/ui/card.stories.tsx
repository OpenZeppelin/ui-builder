import { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

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
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" size="sm">
          Forgot password?
        </Button>
        <Button>Sign in</Button>
      </CardFooter>
    </Card>
  ),
};

export const PricingCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">$19.99</span> / month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            <span>Unlimited projects</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            <span>Unlimited users</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            <span>24/7 support</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Subscribe</Button>
      </CardFooter>
    </Card>
  ),
};

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
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
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
