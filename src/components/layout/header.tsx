/**
 * Header Component
 * Page header with title, description and actions
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

interface HeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  backHref?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  } | React.ReactNode;
}

export function Header({ title, description, showBack, backHref, action }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            {description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {action && (
          typeof action === 'object' && 'label' in action ? (
            action.href ? (
              <Link href={action.href}>
                <Button>
                  <PlusIcon className="w-4 h-4" />
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button onClick={action.onClick}>
                <PlusIcon className="w-4 h-4" />
                {action.label}
              </Button>
            )
          ) : action
        )}
      </div>
    </header>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
