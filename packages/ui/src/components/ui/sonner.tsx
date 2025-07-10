import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

import { JSX } from 'react';

const Toaster = ({ ...props }: ToasterProps): JSX.Element => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-gray-50 group-[.toaster]:border-gray-800 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-gray-400',
          actionButton:
            'group-[.toast]:bg-white group-[.toast]:text-gray-900 group-[.toast]:hover:bg-gray-100 group-[.toast]:font-medium group-[.toast]:border-0',
          cancelButton:
            'group-[.toast]:bg-gray-800 group-[.toast]:text-gray-300 group-[.toast]:hover:bg-gray-700',
          error:
            'group-[.toast]:!bg-red-950 group-[.toast]:!text-red-50 group-[.toast]:!border-red-900',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
