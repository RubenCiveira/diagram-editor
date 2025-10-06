import { withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema, RJSFValidationError } from '@rjsf/utils';
import { Widgets } from '../../Widgets';

/* ---------------------------- Form (tema Material) --------------------------- */

const MuiForm = withTheme<typeof MuiTheme>(MuiTheme);

export type SchemaFormProps<T = any> = {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData: T;
  onChange?: (data: T) => void;
  onSubmit?: (data: T) => void;
  onError?: (errors: RJSFValidationError[]) => void;
  /** Validación en vivo al escribir (por defecto false) */
  liveValidate?: boolean;
  /** Desactiva HTML5 native validation (por defecto true) */
  noHtml5Validate?: boolean;
  /** Texto del botón submit cuando se usa interno (normalmente usas botones externos en el diálogo) */
  submitText?: string;
  /** Deshabilitar el form (readonly) */
  disabled?: boolean;
};

export default function SchemaForm<T>({
  schema,
  uiSchema,
  formData,
  onChange,
  onSubmit,
  onError,
  liveValidate = false,
  noHtml5Validate = true,
  submitText = 'Guardar',
  disabled = false,
}: SchemaFormProps<T>) {
  return (
    <MuiForm
      schema={schema}
      uiSchema={uiSchema}
      formData={formData as any}
      validator={validator}
      widgets={Widgets}
      liveValidate={liveValidate}
      noHtml5Validate={noHtml5Validate}
      disabled={disabled}
      onChange={(e) => onChange?.(e.formData as T)}
      onSubmit={(e) => onSubmit?.(e.formData as T)}
      onError={(errs) => onError?.(errs)}
    >
      {/* Si no gestionas submit externo, RJSF renderiza este botón */}
      <button type="submit" style={{ display: 'none' }}>{submitText}</button>
    </MuiForm>
  );
}
