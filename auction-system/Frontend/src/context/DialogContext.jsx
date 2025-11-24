import { createContext, useCallback, useContext, useState } from 'react';

const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const openDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        showCancel: true,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy',
        ...options,
        inputValue: options?.defaultValue || '',
        resolve,
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (dialog?.resolve) dialog.resolve(dialog?.cancelValue ?? null);
    closeDialog();
  }, [dialog, closeDialog]);

  const handleConfirm = useCallback(() => {
    if (dialog?.requiresInput && !dialog.inputValue?.trim()) return;
    const payload = dialog?.requiresInput ? dialog.inputValue : true;
    if (dialog?.resolve) dialog.resolve(payload);
    closeDialog();
  }, [dialog, closeDialog]);

  const updateInputValue = (value) => {
    setDialog((prev) => (prev ? { ...prev, inputValue: value } : prev));
  };

  return (
    <DialogContext.Provider
      value={{
        confirm: (options) => openDialog({ ...options, showCancel: true }),
        alert: (options) =>
          openDialog({
            ...options,
            showCancel: false,
            cancelValue: true,
            confirmText: options?.confirmText || 'Đã hiểu',
          }),
        prompt: (options) =>
          openDialog({
            ...options,
            requiresInput: true,
            showCancel: true,
            confirmText: options?.confirmText || 'Xác nhận',
          }),
      }}
    >
      {children}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {dialog.icon && <span className="text-3xl">{dialog.icon}</span>}
                <h3 className="text-xl font-semibold text-gray-900">
                  {dialog.title || 'Thông báo'}
                </h3>
              </div>
              {dialog.message && (
                <p className="text-gray-600 whitespace-pre-line">{dialog.message}</p>
              )}
              {dialog.requiresInput && (
                <div className="mt-2">
                  {dialog.inputLabel && (
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {dialog.inputLabel}
                    </label>
                  )}
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={dialog.inputValue}
                    onChange={(e) => updateInputValue(e.target.value)}
                    placeholder={dialog.inputPlaceholder}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {dialog.showCancel !== false && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {dialog.cancelText || 'Hủy'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={dialog.requiresInput && !dialog.inputValue?.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {dialog.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

