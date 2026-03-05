// src/Login.jsx
import React, { useEffect } from "react";
import { Form, Input, Button, Card, Typography, message, ConfigProvider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/Login/authApi";

const { Title, Text } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role) {
      redirectUser(user);
    }
  }, []);

  // ✅ Redirect user based on role or permissions
  const redirectUser = (userData) => {
    // Example role-based redirect
    switch (userData.role) {
      case "ADMIN":
        navigate("/admin/dashboard");
        break;
      case "BOSS":
        navigate("/boss/dashboard");
        break;
        case "MANAGER":
        navigate("/manager/dashboard");
        break;
                                                     ///manager/dashboard
      default:
        navigate("/dashboard");
    }
  };

  const onFinish = async (values) => {
    try {
      const { data } = await login(values);

      if (data.autoSelected) {
        // ✅ STORE AUTH TOKEN
        localStorage.setItem("token", data.token);

        // ✅ STORE LOGGED-IN USER
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: values.email,
            name: data.name || "",
            role: data.company?.role || "USER",
            companyId: data.company?.id || null,
            permissions: data.permissions || [],
            avatar: data.avatar || null,
          })
        );

        // ✅ Notify Header / SideNav
        window.dispatchEvent(new Event("userDataUpdated"));

        // ✅ Redirect based on role
        redirectUser(data.company);
      } else {
        // ✅ Store temp user for company selection
        localStorage.setItem("tempUser", JSON.stringify(data));
        navigate("/select-company");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1890ff", borderRadius: 8 } }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card
            bordered={false}
            className="shadow-2xl rounded-2xl"
            style={{ padding: "40px 32px" }}
          >
            <div className="text-center mb-6">
              <img src="/logo.jpg" alt="Logo" className="h-16 mx-auto mb-4" />
              <Title level={2} className="!mb-1">Welcome Back</Title>
              <Text type="secondary">Sign in to continue</Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
              requiredMark={false}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, message: "Email is required" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your email"
                  className="h-12 rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  className="h-12 rounded-lg"
                />
              </Form.Item>

              <Form.Item className="mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full h-12 rounded-lg text-base font-semibold"
                >
                  Login
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}


