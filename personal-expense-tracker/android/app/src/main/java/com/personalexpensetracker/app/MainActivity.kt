
package com.personalexpensetracker.app

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Navy = Color(0xFF18243A)
private val Green = Color(0xFF20A879)
private val Page = Color(0xFFF6F8FB)
private val Muted = Color(0xFF788397)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Page
                ) {
                    ExpenseTrackerApp()
                }
            }
        }
    }
}

@Composable
fun ExpenseTrackerApp() {
    var isLogin by remember { mutableStateOf(true) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var isLoggedIn by remember { mutableStateOf(false) }
    
    if (isLoggedIn) {
    DashboardScreen(
        onLogout = {
            isLoggedIn = false
            message = ""
            password = ""
            confirmPassword = ""
        }
    )
    return
}

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 26.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(62.dp)
                .background(Green, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text("₹", color = Color.White, fontSize = 34.sp,
                fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(28.dp))

        Text(
            text = if (isLogin) "Welcome back" else "Create account",
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
            color = Navy
        )

        Spacer(Modifier.height(8.dp))

        Text(
            text = if (isLogin)
                "Sign in to manage your money."
            else
                "Start tracking your money with ease.",
            fontSize = 15.sp,
            color = Muted
        )

        Spacer(Modifier.height(30.dp))

        if (!isLogin) {
            TrackerField(
                label = "Full name",
                value = name,
                onValueChange = { name = it },
                placeholder = "Enter your name"
            )
            Spacer(Modifier.height(16.dp))
        }

        TrackerField(
            label = "Email address",
            value = email,
            onValueChange = { email = it },
            placeholder = "you@example.com",
            keyboardType = KeyboardType.Email
        )

        Spacer(Modifier.height(18.dp))

        TrackerField(
            label = "Password",
            value = password,
            onValueChange = { password = it },
            placeholder = "Enter your password",
            password = !showPassword,
            trailing = {
                TextButton(onClick = { showPassword = !showPassword }) {
                    Text(
                        if (showPassword) "Hide" else "Show",
                        color = Green
                    )
                }
            }
        )

        if (!isLogin) {
            Spacer(Modifier.height(18.dp))
            TrackerField(
                label = "Confirm password",
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                placeholder = "Enter password again",
                password = true
            )
        }

        Spacer(Modifier.height(24.dp))

        Button(
            
onClick = {
    if (isLoading) {
        return@Button
    }

    val validationMessage = when {
        email.isBlank() || password.isBlank() ->
            "Please enter your email and password."

        !android.util.Patterns.EMAIL_ADDRESS
            .matcher(email.trim()).matches() ->
            "Please enter a valid email address."

        !isLogin && name.isBlank() ->
            "Please enter your name."

        !isLogin && password.length < 8 ->
            "Password must be at least 8 characters."

        !isLogin && password != confirmPassword ->
            "Passwords do not match."

        else -> ""
    }

    if (validationMessage.isNotEmpty()) {
        message = validationMessage
    } else {
        isLoading = true
        message = ""

        CoroutineScope(Dispatchers.Main).launch {
            try {
                val body = org.json.JSONObject().apply {
                    put("email", email.trim())
                    put("password", password)

                    if (!isLogin) {
                        put("name", name.trim())
                    }
                }

                val path = if (isLogin) {
                    "/api/auth/login"
                } else {
                    "/api/auth/signup"
                }

                val response = ApiClient.post(path, body)
                val success = response.optBoolean("success", false)

                message = if (success) {
                    if (isLogin) {
                        isLoggedIn = true
                        "Login successful!"
                    } else {
                        "Account created successfully! Please sign in."
                    }
                } else {
                    response.optString(
                        "message",
                        "Request failed. Please try again."
                    )
                }

                if (success && !isLogin) {
                    isLogin = true
                    password = ""
                    confirmPassword = ""
                }
            } catch (e: Exception) {
                message = "Connection error: ${e.message ?: "Please try again."}"
            } finally {
                isLoading = false
            }
        }
    }
},
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(15.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Green
            )
        ) {
            Text(
                if (isLogin) "Sign In" else "Create Account",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        if (message.isNotBlank()) {
            Spacer(Modifier.height(14.dp))
            Text(message, color = Navy, fontSize = 13.sp)
        }

        Spacer(Modifier.height(22.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                if (isLogin) "Don't have an account? "
                else "Already have an account? ",
                color = Muted,
                fontSize = 13.sp
            )
            TextButton(
                onClick = {
                    isLogin = !isLogin
                    message = ""
                }
            ) {
                Text(
                    if (isLogin) "Sign Up" else "Sign In",
                    color = Green,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        Text(
            "Simple finances. Clear decisions.",
            modifier = Modifier.fillMaxWidth(),
            color = Muted,
            fontSize = 12.sp
        )
    }
}

@Composable
private fun TrackerField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
    trailing: (@Composable () -> Unit)? = null
) {
    Column {
        Text(
            label,
            color = Navy,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = {
                Text(placeholder, color = Muted)
            },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(
                keyboardType = if (password) KeyboardType.Password
                else keyboardType
            ),
            visualTransformation = if (password)
                PasswordVisualTransformation()
            else VisualTransformation.None,
            trailingIcon = trailing,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Green,
                unfocusedBorderColor = Color(0xFFE0E5ED),
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            )
        )
    }
}



@Composable
private fun DashboardScreen(
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = "My Dashboard",
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
            color = Navy
        )

        Text(
            text = "Simple finances. Clear decisions.",
            fontSize = 15.sp,
            color = Muted
        )

        Text(
            text = "Total Balance",
            fontSize = 16.sp,
            color = Muted
        )

        Text(
            text = "₹0.00",
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            color = Green
        )

        Text(
            text = "Income: ₹0.00",
            fontSize = 18.sp,
            color = Navy
        )

        Text(
            text = "Expenses: ₹0.00",
            fontSize = 18.sp,
            color = Navy
        )

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Green
            )
        ) {
            Text("Log Out")
        }
    }
}