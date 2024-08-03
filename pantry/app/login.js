import { Box, Button, Typography } from "@mui/material";
import { signInWithPopup, auth, provider } from "@/firebase";

const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      flexDirection={"column"}
      gap={2}
    >
      <Typography variant="h3">Pantry App</Typography>
      <Button variant="contained" onClick={handleLogin}>
        Sign in with Google
      </Button>
    </Box>
  );
};

export default Login;
