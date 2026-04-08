import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FormProvider } from './context/FormContext';
import router from './router';

export default function App() {
  return (
    <AuthProvider>
      <FormProvider>
        <RouterProvider router={router} />
      </FormProvider>
    </AuthProvider>
  );
}
