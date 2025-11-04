import { AlertCircle, CheckCircle2, File as FileIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { BaseFieldProps } from './BaseField';
import { ErrorMessage, getAccessibilityProps, validateField } from './utils';

/**
 * FileUploadField component properties
 */
export interface FileUploadFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFieldProps<TFieldValues> {
  /**
   * Accepted file types (e.g., ".zip,.tar.gz")
   */
  accept?: string;
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
  /**
   * Whether to convert the file to base64 string
   */
  convertToBase64?: boolean;
}

/**
 * File upload field component specifically designed for React Hook Form integration.
 *
 * Architecture flow:
 * 1. Form schemas are generated from contract functions using adapters
 * 2. TransactionForm renders the overall form structure with React Hook Form
 * 3. DynamicFormField selects the appropriate field component (like FileUploadField) based on field type
 * 4. BaseField provides consistent layout and hook form integration
 * 5. This component handles file upload-specific rendering and validation
 *
 * The component includes:
 * - Integration with React Hook Form
 * - File type and size validation
 * - Optional conversion to base64 for storage
 * - Visual feedback for selected files
 * - Automatic error handling and reporting
 * - Full accessibility support with ARIA attributes
 * - Keyboard navigation
 */
/**
 * Format bytes to human-readable size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function FileUploadField<TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  placeholder = 'Drop your file here or click to browse',
  helperText,
  control,
  name,
  width = 'full',
  validation,
  readOnly,
  accept,
  maxSize,
  convertToBase64 = false,
}: FileUploadFieldProps<TFieldValues>): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (): void => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix to get just base64
          const parts = reader.result.split(',');
          if (parts.length !== 2) {
            reject(new Error('Invalid data URL format'));
            return;
          }
          const base64 = parts[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (): void => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (
    file: File | null,
    onChange: (value: string | File) => void
  ): Promise<void> => {
    if (!file) {
      setFileName('');
      setFileSize(0);
      setUploadStatus('idle');
      onChange('');
      return;
    }

    // Validate file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      onChange('');
      setFileName('');
      setFileSize(0);
      setUploadStatus('error');
      // This will trigger validation error through React Hook Form
      throw new Error(`File size exceeds ${maxSizeMB} MB limit`);
    }

    setFileName(file.name);
    setFileSize(file.size);
    setUploadStatus('idle');

    // Immediately set the File object so required-field checks pass
    // and upstream loaders can proceed without waiting for conversion.
    onChange(file);

    // If base64 conversion is requested, convert in background and
    // replace the value once ready (keeps UI responsive and avoids
    // triggering preflight missing-field errors).
    if (!convertToBase64) {
      setUploadStatus('success');
      return;
    }

    setIsProcessing(true);

    try {
      const base64 = await handleFileToBase64(file);
      onChange(base64);
      setUploadStatus('success');
    } catch {
      onChange('');
      setFileName('');
      setFileSize(0);
      setUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly && !isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    onChange: (value: string | File) => void
  ): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (readOnly || isProcessing) return;

    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      handleFileChange(file, onChange);
    }
  };

  const clearFile = (onChange: (value: string | File) => void): void => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileName('');
    setFileSize(0);
    setUploadStatus('idle');
    onChange('');
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        validate: (value) => {
          if (!value) return validateField(value, validation);

          // Additional file-specific validations
          if (
            maxSize &&
            value &&
            typeof value === 'object' &&
            'size' in value &&
            value.size > maxSize
          ) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            return `File size must be less than ${maxSizeMB} MB`;
          }

          return validateField(value, validation);
        },
      }}
      disabled={readOnly}
      render={({ field: { onChange, onBlur }, fieldState: { error } }) => {
        const fieldId = `${id}-field`;
        const errorId = `${fieldId}-error`;
        const hasError = !!error;
        const widthClass = width === 'full' ? 'w-full' : width === 'half' ? 'w-1/2' : 'w-1/3';

        // Build helper text with file requirements
        const requirementsText = [];
        if (accept) {
          const types = accept
            .split(',')
            .map((t) => t.trim())
            .join(', ');
          requirementsText.push(`Accepted types: ${types}`);
        }
        if (maxSize) {
          requirementsText.push(`Max size: ${formatFileSize(maxSize)}`);
        }
        const fullHelperText = helperText || requirementsText.join(' • ');

        return (
          <div className={`flex flex-col gap-2 ${widthClass}`}>
            <Label htmlFor={fieldId}>
              {label}
              {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id={fieldId}
              type="file"
              accept={accept}
              disabled={readOnly || isProcessing}
              onBlur={onBlur}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleFileChange(file, onChange);
              }}
              className="hidden"
              {...getAccessibilityProps({
                id: fieldId,
                hasError,
                isRequired: validation?.required,
                isDisabled: readOnly || isProcessing,
              })}
            />

            {/* Drop zone / Upload area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, onChange)}
              onClick={() => {
                if (!readOnly && !isProcessing && !fileName) {
                  fileInputRef.current?.click();
                }
              }}
              className={`
                relative rounded-lg border-2 border-dashed transition-all duration-200
                ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : hasError
                      ? 'border-destructive bg-destructive/5'
                      : fileName
                        ? 'border-border bg-muted/30'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50'
                }
                ${readOnly || isProcessing ? 'cursor-not-allowed opacity-60' : fileName ? 'cursor-default' : 'cursor-pointer'}
                p-6
              `}
            >
              {!fileName ? (
                // Empty state - show upload prompt
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div
                    className={`rounded-full p-3 transition-colors ${
                      isDragOver ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <Upload
                      className={`h-8 w-8 transition-colors ${
                        isDragOver ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {isDragOver ? 'Drop file here' : placeholder}
                    </p>
                    {fullHelperText && !isDragOver && (
                      <p className="text-xs text-muted-foreground">{fullHelperText}</p>
                    )}
                  </div>
                </div>
              ) : (
                // File selected state
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-lg p-2 ${
                      uploadStatus === 'success'
                        ? 'bg-success/10'
                        : uploadStatus === 'error'
                          ? 'bg-destructive/10'
                          : 'bg-muted'
                    }`}
                  >
                    <FileIcon
                      className={`h-8 w-8 ${
                        uploadStatus === 'success'
                          ? 'text-success'
                          : uploadStatus === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileSize)}
                          {isProcessing && ' • Processing...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {uploadStatus === 'success' && !isProcessing && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        {uploadStatus === 'error' && (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                        {!readOnly && !isProcessing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFile(onChange);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {!isProcessing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={readOnly}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-2"
                      >
                        Change file
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <ErrorMessage error={error} id={errorId} />
          </div>
        );
      }}
    />
  );
}
