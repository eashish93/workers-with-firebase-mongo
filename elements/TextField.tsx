import { TextField, TextArea, Label, Input, FieldError, Text } from 'react-aria-components';
import type { TextFieldProps as _TextFieldProps, ValidationResult } from 'react-aria-components';
import { cx } from 'cva';
import { forwardRef, type ForwardedRef } from 'react';

/**
 * Types of textfield styles
 *  - outlined
 *  - filled
 *  - adjacent (or normal) label (label above input)
 * Guidelines
 *  - https://material.io/components/text-fields
 */

export type TextFieldProps = _TextFieldProps &
  Partial<{
    label: string;
    // NOTE: If errorMessage is defined, then helpText will be ignored and replaced by errorMessage.
    helpText: string | React.ReactNode; // can be error or description text.
    errorMessage: string | ((v: ValidationResult) => string); // error message or validation function.
    multiline: boolean; // is it textarea?
    showValidationIcon: boolean; // show validation icon or not (error or success aka check icon)
    rows: number; // number of rows for textarea, only works if multiline set to true.
    // icon or prefix text.
    prefix: React.JSX.Element | string;
    suffix: React.JSX.Element | string;
    // it's deprecated by react-aria team.
    // see: https://github.com/adobe/react-spectrum/pull/2966
    placeholder: string;
    charCount: boolean; // to enable character count description or not.
    // Help popup shown next to label. Only valid for label outside input. See react-spectrum.
    contextualHelp: React.ReactNode;
    // normal means label above inpu and outlined means floating material input.
    // Default is outlined.
    variant: 'outlined' | 'normal';
    inputClassName: string;
  }>;

function AriaTextField(
  {
    label,
    helpText,
    errorMessage,
    multiline,
    rows,
    showValidationIcon,
    prefix,
    suffix,
    placeholder,
    charCount,
    contextualHelp,
    inputClassName,
    variant = 'outlined',
    ...props
  }: TextFieldProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  const InputEl = multiline ? TextArea : Input;

  // We are not using RTL, so we don't need to check for suffix text.
  const isPrefixText = typeof prefix === 'string'; // useful when we are using text or currency symbol as prefix.
  const isSuffixText = typeof suffix === 'string'; // useful when we are using text or currency symbol as suffix
  return (
    <TextField {...props}>
      {({ isInvalid, isDisabled }) => (
        <>
          {/** For variant === normal */}
          {label && variant === 'normal' && (
            <Label
              className={cx(
                'mb-1 block font-medium',
                isInvalid &&
                  'text-error has-[~.rac-input-wrapper_.rac-input:hover:not(:focus)]:text-on-error-container'
              )}>
              {label}
              {props.isRequired && <span className="mx-0.5 text-error">*</span>}
            </Label>
          )}
          <div
            className={cx(
              // using focus-within, we are applying shadow and border on parent. Also hiding top border when placeholder is not shown and on disabled state.
              // Using translateZ or translate3d to force GPU rendering which fix wierd box shadow bug in safari (still preset in 17+)
              // NOTE: Don't set h-14 instead of min-h-14, otherwise textarea will have fixed height.
              'rac-input-wrapper flex min-h-14 border rounded transition [transform:translateZ(0)]',
              // color variants (either invalid aka error or default primary)
              // Doing like this just for readability.
              // Also we can't use focus-within selector, as if button icon is there inside, then clicking on it will also trigger that which we don't want.
              !isInvalid
                ? 'border-outline has-[.rac-input:focus]:border-primary has-[.rac-input:focus]:shadow-[inset_1px_0_rgb(var(--color-primary)),inset_0_-1px_rgb(var(--color-primary)),inset_-1px_0_rgb(var(--color-primary))]'
                : 'border-error has-[.rac-input:focus]:border-error has-[.rac-input:focus]:shadow-[inset_1px_0_rgb(var(--color-error)),inset_0_-1px_rgb(var(--color-error)),inset_-1px_0_rgb(var(--color-error))]',

              // at the end to override all other styles of this.
              label &&
                variant === 'outlined' &&
                'has-[.rac-input:not(:placeholder-shown,:disabled)]:border-t-transparent has-[.rac-input:focus]:border-t-transparent',

              // if label is not provided or variant is normal, then apply full box-shadow.
              !isInvalid
                ? (!label || variant === 'normal') &&
                    'o:has-[.rac-input:focus]:shadow-[inset_0_0_0_1px_rgb(var(--color-primary))]'
                : (!label || variant === 'normal') &&
                    'o:has-[.rac-input:focus]:shadow-[inset_0_0_0_1px_rgb(var(--color-error))]',

              // disabled
              isDisabled && 'o:border-outline/15',
              // When both label, value and input is disabled.
              isDisabled &&
                label &&
                'o:has-[.rac-input:not(:placeholder-shown)]:border-t-transparent',
              // isInvalid &&
              //   label &&
              //   variant === 'outlined' &&
              //   'has-[.rac-input:hover:not(:focus,:placeholder-shown)]:border-t-transparent',

              // hover part
              'has-[.rac-input:hover:not(:focus)]:border-on-primary-container',
              // hover + error (invalid) part. This will override above hover part.
              isInvalid && 'has-[.rac-input:hover:not(:focus)]:border-on-error-container',
              // hover for both (error and primary - remove top border only for outlined variant)
              label &&
                variant === 'outlined' &&
                'has-[.rac-input:hover:not(:focus,:placeholder-shown)]:border-t-transparent',

              // extra className (use with care)
              // This can be used for overriding min-height. But use it only when variant is set to normal.
              inputClassName
            )}>
            {/** For variant === outlined */}
            {label && variant === 'outlined' && (
              <Label
                className={cx(
                  // NOTE: translate-y and top-1/2 will not work here with width/height and transition as we need to transition translate of only text without before/after. So using line-height.
                  // NOTE: According to material specs, we should not truncate label text nor take up multiple lines and it should be short clear and fully visible. That's why we are not using truncate and it will not work properly also.

                  'absolute flex w-[calc(100%+2px)]  h-full left-[-1px] top-[-1px] transition-all font-normal pointer-events-none',
                  // focus
                  'has-[~.rac-input:focus]:text-sm has-[~.rac-input:focus]:font-medium',

                  // For floating label movement.
                  'has-[~.rac-input:not(:placeholder-shown)]:text-sm has-[~.rac-input:not(:placeholder-shown)]:font-medium leading-[3.4] has-[~.rac-input:focus]:leading-[0] has-[~.rac-input:not(:placeholder-shown)]:leading-[0]',

                  // For input state (error, primary).
                  !isInvalid
                    ? 'has-[~.rac-input:focus]:text-primary text-on-surface-variant'
                    : 'has-[~.rac-input:focus]:text-error text-error',

                  // Before and After element. We need this for top border (left and right). Without this, alternate way is to use bg-white on label to hide border shown on top of label, but flaw is to maintain bg of label with bg of body background.
                  // The idea is to create two after/before border for top bar and using flex the three items will align perfectly in straight line.
                  // before element (left width: 16px (12px + 4px margin), height : anything)
                  'before:content-[""] before:w-3 before:h-1.5 before:mr-1 before:transition-all  before:rounded-tl before:border-t before:border-l  has-[~.rac-input:placeholder-shown]:before:border-transparent',

                  // For input state (error, primary). before part.
                  !isInvalid
                    ? 'before:border-outline has-[~.rac-input:focus]:before:!border-primary has-[~.rac-input:focus]:before:shadow-[inset_1px_0_rgb(var(--color-primary)),inset_0_1px_rgb(var(--color-primary))] '
                    : 'before:border-error has-[~.rac-input:focus]:before:!border-error has-[~.rac-input:focus]:before:shadow-[inset_1px_0_rgb(var(--color-error)),inset_0_1px_rgb(var(--color-error))]',

                  // after element
                  'after:content[""] after:flex-grow after:w-3 after:h-1.5 after:ml-1 after:transition-all  after:rounded-tr after:border-t after:border-r has-[~.rac-input:placeholder-shown]:after:border-transparent',

                  // For input state (error, primary). after part.
                  !isInvalid
                    ? 'after:border-outline has-[~.rac-input:focus]:after:!border-primary has-[~.rac-input:focus]:after:shadow-[inset_0_1px_rgb(var(--color-primary)),inset_-1px_0_rgb(var(--color-primary))] '
                    : 'after:border-error has-[~.rac-input:focus]:after:!border-error has-[~.rac-input:focus]:after:shadow-[inset_0_1px_rgb(var(--color-error)),inset_-1px_0_rgb(var(--color-error))]',

                  // Not need to style for after/before as label will always be at rest.
                  isDisabled && 'o:text-on-surface/40',
                  // slightly fade top (left, right) border when input is disabled, label is floating and is disabled.
                  isDisabled &&
                    'has-[~.rac-input:not(:placeholder-shown)]:before:border-t-outline/15 has-[~.rac-input:not(:placeholder-shown)]:after:border-t-outline/15 has-[~.rac-input:not(:placeholder-shown)]:before:border-l-outline/15 has-[~.rac-input:not(:placeholder-shown)]:after:border-r-outline/15',
                  // If input has prefix. Suffix styling not required for the label.
                  prefix &&
                    'has-[~.rac-input:placeholder-shown:not(:focus)]:before:w-12 has-[~.rac-input:focus]:before:w-3',
                  isPrefixText && 'has-[~.rac-input:placeholder-shown:not(:focus)]:before:w-10',

                  // hover + error (invalid) part or hover (primary)
                  isInvalid
                    ? 'has-[~.rac-input:hover:not(:focus)]:text-on-error-container has-[~.rac-input:hover:not(:focus,:placeholder-shown)]:before:border-on-error-container has-[~.rac-input:hover:not(:focus,:placeholder-shown)]:after:border-on-error-container'
                    : 'has-[~.rac-input:hover:not(:focus)]:text-on-primary-container has-[~.rac-input:hover:not(:focus,:placeholder-shown)]:before:border-on-primary-container has-[~.rac-input:hover:not(:focus,:placeholder-shown)]:after:border-on-primary-container'
                )}>
                {label}
                {props.isRequired && <span className="mx-0.5 text-error">*</span>}
              </Label>
            )}
            {prefix && <div className={cx('absolute self-center z-10 left-4')}>{prefix}</div>}
            <InputEl
              ref={ref as any}
              placeholder={placeholder ?? ' '} // Safari doesn't work with '' placeholder. So using ' '.
              className={cx(
                'rac-input appearance-none w-full bg-transparent caret-primary text-on-surface font-normal placeholder:text-on-surface/40 px-4 py-2 disabled:text-on-surface/40 disabled:pointer-events-none resize-none autofill:bg-clip-text relative rounded-md',
                'focus:outline-none',
                // disable placeholder if label is defined.
                label && 'placeholder:text-transparent',
                isPrefixText ? 'o:pl-8' : prefix && 'o:pl-12',
                suffix && 'o:pr-14',
                multiline && 'pt-3',
                isInvalid && 'focus:caret-error'
              )}
              rows={rows}
            />
            {suffix && <div className={cx('absolute self-center z-10 right-4')}>{suffix}</div>}
          </div>
          {helpText && !isInvalid && (
            <Text
              slot="description"
              className={cx(
                'text-xs block text-on-surface-variant pt-1',
                variant === 'outlined' ? 'px-4' : 'px-0.5',
                isDisabled && 'o:text-on-surface/40'
              )}>
              {helpText}
            </Text>
          )}
          {/** errorMessage is optional. If not defined, then will use browser native text message. */}
          <FieldError
            className={cx(
              'text-xs block text-error pt-1',
              variant === 'outlined' ? 'px-4' : 'px-0.5'
            )}>
            {errorMessage}
          </FieldError>
        </>
      )}
    </TextField>
  );
}

const _TextField = /*#__PURE__*/ forwardRef(AriaTextField);

export { _TextField as TextField };
