"use client";
import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  IconButton,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import {
  firestore,
  auth,
  signInWithPopup,
  provider,
  signOut,
} from "@/firebase";
import {
  collection,
  getDocs,
  query,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Login from "@/app/components/login";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const editStyle = {
  ...style,
  width: 300,
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditOpen = (item) => {
    setCurrentItem({
      ...item,
      originalName: item.name, // Store the original name for comparison
    });
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setCurrentItem(null);
    setEditOpen(false);
  };

  const updatePantry = async () => {
    try {
      if (user) {
        console.log("Updating pantry for user: ", user.uid);
        const snapshot = query(
          collection(firestore, "users", user.uid, "pantry")
        );
        const docs = await getDocs(snapshot);

        if (docs.empty) {
          console.log("No pantry items found for user: ", user.uid);
          setPantry([]);
        } else {
          console.log(
            "Pantry documents: ",
            docs.docs.map((doc) => doc.data())
          );
          const pantryList = docs.docs.map((doc) => ({
            name: doc.id,
            ...doc.data(),
          }));
          console.log("Pantry list: ", pantryList);
          setPantry(pantryList);
        }
      }
    } catch (error) {
      console.error("Error updating pantry: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("User logged in: ", currentUser);
        setUser(currentUser);
        updatePantry();
      } else {
        console.log("No user logged in");
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const addItem = async (item) => {
    try {
      const docRef = doc(
        collection(firestore, "users", user.uid, "pantry"),
        item
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { count } = docSnap.data();
        await setDoc(docRef, { count: count + 1 });
      } else {
        await setDoc(docRef, { count: 1 });
      }
      await updatePantry();
    } catch (error) {
      console.error("Error adding item: ", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(
        collection(firestore, "users", user.uid, "pantry"),
        item
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { count } = docSnap.data();
        if (count > 1) {
          await setDoc(docRef, { count: count - 1 });
        } else {
          await deleteDoc(docRef);
        }
      }
      await updatePantry();
    } catch (error) {
      console.error("Error removing item: ", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result.split(",")[1];
        const image = {
          data: base64String,
          mimeType: file.type,
        };

        try {
          const response = await axios.post(
            "/api/generate",
            { image },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const result = response.data;
          const itemName = result.response.text;
          if (itemName) {
            await addItem(itemName);
          }
        } catch (error) {
          console.error("Error uploading image: ", error);
        }
      };
    } catch (error) {
      console.error("Error reading file: ", error);
    }
  };

  const handleEditItem = async () => {
    try {
      const { name, count } = currentItem;

      // Handle case where item name might change
      if (currentItem.originalName !== name) {
        // Delete the old item
        const oldDocRef = doc(
          collection(firestore, "users", user.uid, "pantry"),
          currentItem.originalName
        );
        await deleteDoc(oldDocRef);

        // Add the new item with updated name
        const newDocRef = doc(
          collection(firestore, "users", user.uid, "pantry"),
          name
        );
        await setDoc(newDocRef, { count });
      } else {
        // Update the count of the existing item
        const docRef = doc(
          collection(firestore, "users", user.uid, "pantry"),
          name
        );
        await setDoc(docRef, { count });
      }

      await updatePantry();
      handleEditClose();
    } catch (error) {
      console.error("Error updating item: ", error);
    }
  };

  const filteredPantry = pantry.filter(({ name }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <Login />;
  } else {
    updatePantry();
  }

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
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width={"100%"} direction={"row"} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName);
                setItemName("");
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={editOpen}
        onClose={handleEditClose}
        aria-labelledby="edit-modal-title"
        aria-describedby="edit-modal-description"
      >
        <Box sx={editStyle}>
          <Typography id="edit-modal-title" variant="h6" component="h2">
            Edit Item
          </Typography>
          <Stack width={"100%"} direction={"column"} spacing={2}>
            <TextField
              id="edit-item-name"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={currentItem?.name || ""}
              onChange={(e) =>
                setCurrentItem({ ...currentItem, name: e.target.value })
              }
            />
            <TextField
              id="edit-item-count"
              label="Quantity"
              variant="outlined"
              type="number"
              fullWidth
              value={currentItem?.count || ""}
              onChange={(e) =>
                setCurrentItem({
                  ...currentItem,
                  count: parseInt(e.target.value, 10),
                })
              }
            />
            <Button variant="outlined" onClick={handleEditItem}>
              Save
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Button variant="contained" onClick={handleOpen}>
        Add
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => signOut(auth)}
      >
        Sign Out
      </Button>
      <TextField
        width="100px"
        id="search-field"
        label="Search Items"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <input
        accept="image/*"
        style={{ display: "none" }}
        id="icon-button-file"
        type="file"
        onChange={handleImageUpload}
      />
      <label htmlFor="icon-button-file">
        <IconButton
          color="primary"
          aria-label="upload picture"
          component="span"
        >
          <PhotoCamera />
        </IconButton>
      </label>
      <Box border={"1px solid #333"}>
        <Box
          width="800px"
          height="100px"
          bgcolor={"#ADD8E6"}
          display={"flex"}
          justifyContent={"center"}
        >
          <Typography variant={"h2"} color={"#333"} textAlign={"center"}>
            Pantry Items
          </Typography>
        </Box>
        <Stack width="800px" height="200px" spacing={2} overflow={"auto"}>
          {filteredPantry.map(({ name, count }) => (
            <Box
              key={name}
              width="100%"
              minHeight="300px"
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              bgcolor={"#f0f0f0"}
              paddingX={5}
            >
              <Typography variant={"h3"} color={"#333"}>
                {name} - {count}
              </Typography>
              <Stack direction={"row"} spacing={2}>
                <Button onClick={() => removeItem(name)}>-</Button>
                <Button onClick={() => addItem(name)}>+</Button>
                <Button onClick={() => handleEditOpen({ name, count })}>
                  Edit
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
