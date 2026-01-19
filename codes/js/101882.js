import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { auth, db } from "./firebaseConfig";

export default function RecipeScreen({ route }) {
  const { items } = route.params;
  const navigation = useNavigation();
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [cacheExpiry, setCacheExpiry] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const currentTime = new Date().getTime();
    if (!recipe || (cacheExpiry && cacheExpiry < currentTime)) {
      generateRecipe(items);
    }
  }, [items, recipe, cacheExpiry]);

  const generateRecipe = async (items) => {
    try {
      setLoading(true);

      const payload = {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a recipe based on the following items: ${items}`,
          },
        ],
      };

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer sk-proj-07saghRJeF4XXbrxES8sT3BlbkFJUWSMyBU9NSRKvBt5K9Of",
          },
        },
      );

      const generatedRecipe = response.data.choices[0].message.content;
      setRecipe(generatedRecipe);
      setCacheExpiry(new Date().getTime() + 10 * 60 * 1000);
    } catch (error) {
      console.error("Error generating recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser);

      if (currentUser) {
        const recipesCollection = db
          .collection("users")
          .doc(currentUser.uid)
          .collection("recipes");

        if (!isLiked) {
          // Generate a recipe name using ChatGPT and save it to Firestore
          const recipeName = await generateRecipeName(recipe);

          const recipeRef = await recipesCollection.add({
            name: recipeName,
            content: recipe,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });

          console.log("Recipe saved to Firestore with ID:", recipeRef.id);
        }
      } else {
        console.log("No user is currently logged in.");
      }
    } catch (error) {
      console.error("Error saving recipe to Firestore:", error);
    }

    setIsLiked(!isLiked);
  };

  const generateRecipeName = async (recipe) => {
    try {
      const payload = {
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: `Generate a short and catchy name for the following recipe with an emoji:\n\n${recipe}`,
          },
        ],
      };

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer sk-proj-07saghRJeF4XXbrxES8sT3BlbkFJUWSMyBU9NSRKvBt5K9Of",
          },
        },
      );

      const generatedName = response.data.choices[0].message.content.trim();
      return generatedName;
    } catch (error) {
      console.error("Error generating recipe name:", error);
      return "Recipe Name";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generated Recipe</Text>
        <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={24}
            color={isLiked ? "red" : "gray"}
          />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <Text>Generating recipe...</Text>
        ) : recipe ? (
          <Markdown
            style={styles.recipeText}
            styles={{ heading1: { fontSize: 24 }, text: { fontSize: 16 } }}
          >
            {recipe}
          </Markdown>
        ) : (
          <Text>No recipe generated.</Text>
        )}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => generateRecipe(items)}
        >
          <Text style={styles.regenerateButtonText}>Regenerate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  likeButton: {
    padding: 10,
    borderRadius: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  recipeText: {
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    backgroundColor: "#097969",
    padding: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  regenerateButton: {
    backgroundColor: "#097969",
    padding: 10,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  regenerateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});
