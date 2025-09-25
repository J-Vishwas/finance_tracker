import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, SignIn } from "@clerk/clerk-react";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import ReceiptUpload from "./pages/ReceiptUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/sign-in"
            element={
              <>
                <SignedOut>
                  <SignIn routing="path" path="/sign-in" />
                </SignedOut>
                <SignedIn>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </SignedIn>
              </>
            }
          />

          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/add"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <AddTransaction />
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/transactions"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <Transactions />
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/upload"
            element={
              <>
                <SignedIn>
                  <Layout>
                    <ReceiptUpload />
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
