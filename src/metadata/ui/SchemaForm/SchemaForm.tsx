import { withTheme } from '@rjsf/core';
import { Theme as MuiTheme } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema, RJSFValidationError } from '@rjsf/utils';
import { Widgets } from '../../Widgets';
import FormWizard from 'react-form-wizard-component';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TabPage } from '../../FormDefinition';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-form-wizard-component/dist/style.css';
import './rfw-overrides.css';

/* ---------------------------- Form (tema Material) --------------------------- */

const MuiForm = withTheme<typeof MuiTheme>(MuiTheme);

export type SchemaFormState = {
  hasNext: boolean;
  hasPrev: boolean;
  canSave: boolean;
  canAccept: boolean;
  // isWizzard: boolean;
};

export type SchemaFormRef = {
  next(): void;
  prev(): void;
  goTo(index: number): void;
  reset(): void;
};

export type SchemaFormProps<T = any> = {
  formData: T;
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  onUpdate?: (state: SchemaFormState) => void;
  onChange?: (data: T) => void;
  onSubmit?: (data: T) => void;
  onError?: (errors: RJSFValidationError[]) => void;
  hideButtons?: boolean;
  /** Validación en vivo al escribir (por defecto false) */
  liveValidate?: boolean;
  /** Desactiva HTML5 native validation (por defecto true) */
  noHtml5Validate?: boolean;
  /** Texto del botón submit cuando se usa interno (normalmente usas botones externos en el diálogo) */
  submitText?: string;
  /** Deshabilitar el form (readonly) */
  disabled?: boolean;
};

const SchemaForm = forwardRef<SchemaFormRef, SchemaFormProps>((attrs, ref) => {
  const wizRef = useRef<any>(null);
  const {
    schema,
    uiSchema,
    formData,
    onUpdate,
    onChange,
    onSubmit,
    onError,
    liveValidate = false,
    noHtml5Validate = true,
    submitText = 'Guardar',
    disabled = false,
  } = attrs;

  const [count, setCount] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(1);

  useEffect(() => {
    setCount(Array.isArray(schema) ? schema.length : 0);
  }, [schema]);

   useEffect(() => {
    //  console.log("FIRE FROM " + activeIndex + " AS " + count );
     if (onUpdate) {
       onUpdate?.({
         hasNext: activeIndex < count,
         hasPrev: activeIndex > 1,
         canSave: true,
         canAccept: true,
       });
     }
   }, [count, activeIndex]);

  const handleTabChange = useCallback(
    ({ nextIndex }: { nextIndex: number }) => {
      queueMicrotask(() => {
        setActiveIndex(nextIndex);
      });
      // console.log('Tab change' + nextIndex + ' === ' + activeIndex);
      // if (pendingIndexRef.current !== nextIndex) {
        //  console.log("UPDATE WITH ", nextIndex);
        //  pendingIndexRef.current = nextIndex;
      // }
      // if (activeIndex !== nextIndex) {
        // console.log('FIRE');
        // setActiveIndex(nextIndex);
        /*
        if (onUpdate) {
          onUpdate?.({
            hasNext: nextIndex < count,
            hasPrev: nextIndex > 1,
            canSave: true,
            canAccept: true,
          });
        }
          */
      // }
    },
    [count, activeIndex, setActiveIndex],
  );

  // useEffect(() => {
  //   console.log("AS: " , pendingIndexRef.current );
  //   if (pendingIndexRef.current !== null) {
  //     console.log("FIRE CH FROM", pendingIndexRef.current);
  //     setActiveIndex(pendingIndexRef.current);
  //     // pendingIndexRef.current = null;
  //   }
  // }, [pendingIndexRef]);

  // exponer API hacia fuera
  useImperativeHandle(
    ref,
    () => ({
      next: () => wizRef.current?.nextTab?.(),
      prev: () => wizRef.current?.prevTab?.(),
      goTo: (i: number) => wizRef.current?.goToTab?.(i),
      reset: () => wizRef.current?.reset?.(),
      raw: () => wizRef.current ?? null,
    }),
    [],
  );

  if (Array.isArray(schema)) {
    return (
      <>
        <div className="react-form-wizard">
          <FormWizard
            stepSize="sm"
            onTabChange={handleTabChange}
            ref={wizRef}
            backButtonTemplate={() => null}
            nextButtonTemplate={() => null}
            finishButtonTemplate={() => null}
          >
            {schema.map((tab: TabPage) => (
              <FormWizard.TabContent title={tab.title} icon={tab.icon}>
                <h3> {tab.description || tab.title} </h3>
                {tab.information ? <p> {tab.information}</p> : ''}
                <div className="mui-scope">
                  <MuiForm
                    schema={tab.schema}
                    uiSchema={tab.ui}
                    formData={formData as any}
                    validator={validator}
                    widgets={Widgets}
                    liveValidate={liveValidate}
                    noHtml5Validate={noHtml5Validate}
                    disabled={disabled}
                    showErrorList={false}
                    onChange={(e) => onChange?.(e.formData)}
                    onSubmit={(e) => onSubmit?.(e.formData)}
                    onError={(errs) => onError?.(errs)}
                  >
                    {/* Si no gestionas submit externo, RJSF renderiza este botón */}
                    <button type="submit" style={{ display: 'none' }}>
                      {submitText}
                    </button>
                  </MuiForm>
                </div>
              </FormWizard.TabContent>
            ))}
          </FormWizard>
        </div>
      </>
    );
  } else {
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
        showErrorList={false}
        onChange={(e) => onChange?.(e.formData)}
        onSubmit={(e) => onSubmit?.(e.formData)}
        onError={(errs) => onError?.(errs)}
      >
        {/* Si no gestionas submit externo, RJSF renderiza este botón */}
        <button type="submit" style={{ display: 'none' }}>
          {submitText}
        </button>
      </MuiForm>
    );
  }
});

export default SchemaForm;

