import { RouterProvider } from 'react-router';
import { ThemeProvider } from "next-themes";
import { UserProvider } from './contexts/UserContext';
import { router } from './routes';
import { Agentation } from 'agentation';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <UserProvider>
        <RouterProvider router={router} />
        <Toaster />
        <Agentation />
      </UserProvider>
    </ThemeProvider>
  );
}
