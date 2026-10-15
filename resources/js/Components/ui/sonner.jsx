import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-2 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:p-4",
          description: "group-[.toast]:text-gray-600",
          actionButton:
            "group-[.toast]:bg-green-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
          success: "group-[.toast]:!bg-green-500 group-[.toast]:!text-white group-[.toast]:!border-green-600",
          error: "group-[.toast]:!bg-red-500 group-[.toast]:!text-white group-[.toast]:!border-red-600",
          warning: "group-[.toast]:!bg-yellow-500 group-[.toast]:!text-white group-[.toast]:!border-yellow-600",
          info: "group-[.toast]:!bg-blue-500 group-[.toast]:!text-white group-[.toast]:!border-blue-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
