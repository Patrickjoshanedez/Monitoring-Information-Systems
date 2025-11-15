import * as React from 'react';

interface RecaptchaFieldProps {
  onChange?: (token: string | null) => void;
  onExpired?: () => void;
  className?: string;
}

interface RecaptchaFieldHandle {
  reset: () => void;
}

type RecaptchaComponent = React.ForwardRefExoticComponent<
  RecaptchaFieldProps & React.RefAttributes<RecaptchaFieldHandle>
>;

declare module '../common/RecaptchaField.jsx' {
  const RecaptchaField: RecaptchaComponent;
  export default RecaptchaField;
}

declare module '../../components/common/RecaptchaField.jsx' {
  const RecaptchaField: RecaptchaComponent;
  export default RecaptchaField;
}

declare module '../../../components/common/RecaptchaField.jsx' {
  const RecaptchaField: RecaptchaComponent;
  export default RecaptchaField;
}
