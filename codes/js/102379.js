import axios from 'axios';

// DeepSeek API key
// In a production environment, this should be stored securely
// and not exposed in the client-side code
const API_KEY = 'sk-b46e4ce10ce044e8b3d8523eb26ac0e8';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Generate UI code based on user prompt and selected framework
 * @param {string} prompt - User's description of the UI element
 * @param {string} framework - Selected UI framework (shadcn, bootstrap, material, android, html)
 * @returns {Promise<string>} - Generated code
 */
export const generateUICode = async (prompt, framework) => {
  // Store the original prompt for mock responses
  const originalPrompt = prompt;

  // Create a system prompt based on the selected framework
  const systemPrompt = getSystemPromptForFramework(framework);

  // Create a more specific user prompt that includes the framework
  const enhancedPrompt = `Create the following UI component using ONLY ${getFrameworkFullName(framework)}: ${prompt}.
  The component must be implemented using ${getFrameworkFullName(framework)} and no other framework.`;

  // Prepare the messages for the API
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: enhancedPrompt }
  ];

  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-coder', // Using DeepSeek's coder model
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // Extract the generated code from the response
    return {
      code: response.data.choices[0].message.content,
      usedMock: false
    };
  } catch (error) {
    console.error('Error generating UI code:', error);

    // For development purposes, return a mock response if API call fails
    const mockCode = getMockResponse(framework, originalPrompt);
    return {
      code: mockCode,
      usedMock: true
    };
  }
};

/**
 * Get the full name of the framework for use in prompts
 * @param {string} framework - Framework ID
 * @returns {string} - Full name of the framework
 */
const getFrameworkFullName = (framework) => {
  const frameworkNames = {
    shadcn: 'shadcn UI for React',
    bootstrap: 'Bootstrap 5',
    material: 'Material UI for React',
    android: 'Android XML',
    html: 'HTML, CSS, and JavaScript'
  };

  return frameworkNames[framework] || frameworkNames.html;
};

/**
 * Get system prompt based on the selected framework
 * @param {string} framework - Selected UI framework
 * @returns {string} - System prompt for the selected framework
 */
const getSystemPromptForFramework = (framework) => {
  const prompts = {
    shadcn: `You are an expert UI developer specializing in shadcn UI components for React.
    Generate clean, accessible, and reusable UI components using ONLY shadcn UI.
    You must use shadcn UI components and not any other framework.
    Provide only the code without explanations. The code should be complete and ready to use.
    Include all necessary imports and styling.
    The code should be in JSX format for React.`,

    bootstrap: `You are an expert UI developer specializing in Bootstrap 5.
    Generate clean, responsive, and accessible UI components using ONLY Bootstrap 5.
    You must use Bootstrap 5 components and not any other framework.
    Provide only the code without explanations. The code should be complete and ready to use.
    Include all necessary HTML, CSS, and JavaScript.`,

    material: `You are an expert UI developer specializing in Material UI for React.
    Generate clean, accessible, and reusable UI components using ONLY Material UI.
    You must use Material UI components and not any other framework.
    Provide only the code without explanations. The code should be complete and ready to use.
    Include all necessary imports and styling.
    The code should be in JSX format for React.`,

    android: `You are an expert Android UI developer.
    Generate clean, accessible, and reusable UI components using ONLY XML for Android.
    You must use Android XML and not any other framework.
    Provide only the code without explanations. The code should be complete and ready to use.
    Include all necessary XML attributes and styling.`,

    html: `You are an expert web developer.
    Generate clean, accessible, and reusable UI components using ONLY HTML, CSS, and JavaScript.
    You must use plain HTML, CSS, and JavaScript and not any framework.
    Provide only the code without explanations. The code should be complete and ready to use.
    Include all necessary HTML, CSS, and JavaScript.`
  };

  return prompts[framework] || prompts.html;
};

/**
 * Get mock response for development purposes
 * @param {string} framework - Selected UI framework
 * @param {string} prompt - User's prompt
 * @returns {string} - Mock response
 */
const getMockResponse = (framework, prompt = '') => {
  // Log the framework being requested for debugging
  console.log(`Generating mock response for framework: ${framework}`);
  console.log(`Prompt: ${prompt}`);

  // Determine what kind of component to return based on the prompt
  const isLoginForm = /login|sign in|signin|authentication|credentials/i.test(prompt);

  // Mock responses for development purposes
  // Use the prompt to determine what kind of component to return
  // For development, we'll just check if the prompt contains certain keywords

  // Default mock responses by component type
  const loginComponents = {
    shadcn: `import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// This is a shadcn UI login component
export function LoginForm() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Your email address" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Your password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Login</Button>
      </CardFooter>
    </Card>
  );
}`,

    bootstrap: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <title>Bootstrap Login Form</title>
</head>
<body>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow">
          <div class="card-header bg-primary text-white">
            <h4 class="card-title mb-0">Login</h4>
          </div>
          <div class="card-body">
            <form>
              <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="email" placeholder="name@example.com" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" required>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="rememberMe">
                <label class="form-check-label" for="rememberMe">Remember me</label>
              </div>
              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary">Sign In</button>
              </div>
            </form>
          </div>
          <div class="card-footer text-center">
            <a href="#" class="text-decoration-none">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`,

    material: `import React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';

export default function LoginForm() {
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
      password: data.get('password'),
    });
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}`,

    android: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="16dp">

    <TextView
        android:id="@+id/textViewTitle"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Login"
        android:textSize="24sp"
        android:textStyle="bold"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        android:layout_marginTop="48dp"/>

    <com.google.android.material.textfield.TextInputLayout
        android:id="@+id/textInputLayoutEmail"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="32dp"
        android:hint="Email"
        style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox"
        app:layout_constraintTop_toBottomOf="@id/textViewTitle"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <com.google.android.material.textfield.TextInputEditText
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textEmailAddress"/>

    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.textfield.TextInputLayout
        android:id="@+id/textInputLayoutPassword"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:hint="Password"
        style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox"
        app:passwordToggleEnabled="true"
        app:layout_constraintTop_toBottomOf="@id/textInputLayoutEmail"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <com.google.android.material.textfield.TextInputEditText
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textPassword"/>

    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.checkbox.MaterialCheckBox
        android:id="@+id/checkBoxRememberMe"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Remember me"
        android:layout_marginTop="8dp"
        app:layout_constraintTop_toBottomOf="@id/textInputLayoutPassword"
        app:layout_constraintStart_toStartOf="parent"/>

    <com.google.android.material.button.MaterialButton
        android:id="@+id/buttonLogin"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Login"
        android:padding="12dp"
        android:layout_marginTop="24dp"
        app:layout_constraintTop_toBottomOf="@id/checkBoxRememberMe"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"/>

    <TextView
        android:id="@+id/textViewForgotPassword"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Forgot Password?"
        android:textColor="@color/design_default_color_primary"
        android:layout_marginTop="16dp"
        app:layout_constraintTop_toBottomOf="@id/buttonLogin"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"/>

</androidx.constraintlayout.widget.ConstraintLayout>`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Form</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    body {
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    .login-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 350px;
      overflow: hidden;
    }

    .login-header {
      background-color: #4f46e5;
      color: white;
      padding: 20px;
      text-align: center;
    }

    .login-header h2 {
      margin-bottom: 5px;
      font-weight: 600;
    }

    .login-form {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #374151;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }

    .remember-me {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }

    .remember-me input {
      margin-right: 8px;
    }

    .login-button {
      background-color: #4f46e5;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 15px;
      width: 100%;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .login-button:hover {
      background-color: #4338ca;
    }

    .login-footer {
      text-align: center;
      padding: 15px 20px;
      border-top: 1px solid #e5e7eb;
    }

    .login-footer a {
      color: #4f46e5;
      text-decoration: none;
    }

    .login-footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h2>Login</h2>
      <p>Enter your credentials to access your account</p>
    </div>
    <div class="login-form">
      <form>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="••••••••" required>
        </div>
        <div class="remember-me">
          <input type="checkbox" id="remember">
          <label for="remember">Remember me</label>
        </div>
        <button type="submit" class="login-button">Sign In</button>
      </form>
    </div>
    <div class="login-footer">
      <a href="#">Forgot your password?</a>
    </div>
  </div>
</body>
</html>`
  };

  // If it's a login form request, return the login components
  if (isLoginForm) {
    return loginComponents[framework] || loginComponents.html;
  }

  // For other types of components, we could add more mock responses here
  // For now, just return the login components as a fallback
  return loginComponents[framework] || loginComponents.html;
};
