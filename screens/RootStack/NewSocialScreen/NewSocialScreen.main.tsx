import React, { useState, useEffect } from "react";
import { Platform, View } from "react-native";
import { Appbar, TextInput, Snackbar, Button, ActivityIndicator } from "react-native-paper";
import { getFileObjectAsync, uuid } from "../../../Utils";

// See https://github.com/mmazzarolo/react-native-modal-datetime-picker
// Most of the date picker code is directly sourced from the example.
import DateTimePickerModal from "react-native-modal-datetime-picker";

// See https://docs.expo.io/versions/latest/sdk/imagepicker/
// Most of the image picker code is directly sourced from the example.
import * as ImagePicker from "expo-image-picker";
import { styles } from "./NewSocialScreen.styles";

import firebase from "firebase/app";
import "firebase/firestore";
import { getFirestore, doc, collection, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getApp } from "firebase/app";
import { SocialModel } from "../../../models/social";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../RootStackScreen";

interface Props {
  navigation: StackNavigationProp<RootStackParamList, "NewSocialScreen">;
}

export default function NewSocialScreen({ navigation }: Props) {
  /* TODO: Declare state variables for all of the attributes 
           that you need to keep track of on this screen.
    
     HINTS:

      1. There are five core attributes that are related to the social object.
      2. There are two attributes from the Date Picker.
      3. There is one attribute from the Snackbar.
      4. There is one attribute for the loading indicator in the submit button.
  
  */

  // TODO: Follow the Expo Docs to implement the ImagePicker component.
  // https://docs.expo.io/versions/latest/sdk/imagepicker/

  // TODO: Follow the GitHub Docs to implement the react-native-modal-datetime-picker component.
  // https://github.com/mmazzarolo/react-native-modal-datetime-picker

  // TODO: Follow the SnackBar Docs to implement the Snackbar component.
  // https://callstack.github.io/react-native-paper/snackbar.html

  const [name, setName] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [date, setDate] = useState<Date>()

  //for DatePicker
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)


  const handleConfirm = (date: Date) => {
    setDate(date)
    setDatePickerVisibility(false)
    let month = date.getMonth() + 1
    let dateNum = date.getDate()
    let year = date.getFullYear()
    let fullDateAndTime = ("" + month + "/" + dateNum + "/" + year + 
                            ", " + date.toLocaleTimeString('en-US'))

  }

  //for ImagePicker
  const [image, setImage] = useState("")


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })
    if (!result.cancelled) {
      setImage(result.uri);
    }
  }


  //for SnackBar
  const [visible, setVisible] = useState(false)
  const onDismissSnackBar = () => setVisible(false);

  //for loading icon in submit button
  const [isLoading, setIsLoading] = useState(false)



  const saveEvent = async () => {
    // TODO: Validate all fields (hint: field values should be stored in state variables).
    // If there's a field that is missing data, then return and show an error
    // using the Snackbar.
    if (!name || !location || !description || !image || !date ) {
      setVisible(true)
      return //add this because we dont want to save event to db if it is not properly filled
    }
    // Otherwise, proceed onwards with uploading the image, and then the object.

    try {
      setIsLoading(true);

      // NOTE: THE BULK OF THIS FUNCTION IS ALREADY IMPLEMENTED FOR YOU IN HINTS.TSX.
      // READ THIS TO GET A HIGH-LEVEL OVERVIEW OF WHAT YOU NEED TO DO, THEN GO READ THAT FILE!

      // (0) Firebase Cloud Storage wants a Blob, so we first convert the file path
      // saved in our eventImage state variable to a Blob.
      const object: any = await getFileObjectAsync(image);

      // (1) Write the image to Firebase Cloud Storage. Make sure to do this
      // using an "await" keyword, since we're in an async function. Name it using
      // the uuid provided below.
      const storage = getStorage(getApp());
      const storageRef = ref(storage, uuid() + ".jpg");
      const result = await uploadBytes(storageRef, object);

      // (2) Get the download URL of the file we just wrote. We're going to put that
      // download URL into Firestore (where our data itself is stored). Make sure to
      // do this using an async keyword.
      const downloadURL = await getDownloadURL(result.ref);

      // (3) Construct & write the social model to the "socials" collection in Firestore.
      // The eventImage should be the downloadURL that we got from (3).
      // Make sure to do this using an async keyword.

      const db = getFirestore()
      const socialRef = doc(db, 'socials', name)
      
      const socialDoc: SocialModel = {
        eventName: name,
        eventDate: date.getTime(),
        eventLocation: location,
        eventDescription: description,
        eventImage: downloadURL,
      };

      await setDoc(socialRef, socialDoc);
      console.log("Finished social creation.");
      
      setIsLoading(false);
      // (4) If nothing threw an error, then go back to the previous screen.
      //     Otherwise, show an error.
      navigation.navigate("Main")

    } catch (e) {
      console.log("Error while writing social:", e);
    }
  };

  const Bar = () => {
    return (
      <Appbar.Header>
        <Appbar.Action onPress={navigation.goBack} icon="close" />
        <Appbar.Content title="Socials" />
      </Appbar.Header>
    );
  };

  return (
    <>
      <Bar />
      <View style={{ ...styles.container, padding: 20 }}>
        {/* TextInput */}
        <TextInput 
          onChangeText={name => setName(name)}
          value={name}
          autoComplete={false}
          label='Event Name'
          mode='flat'/>
        {/* TextInput */}
        <TextInput 
          onChangeText={location => setLocation(location)}
          value={location}
          autoComplete={false}
          label='Event Location'
          mode = 'flat'/>
        {/* TextInput */}
        <TextInput 
          onChangeText={description => setDescription(description)}
          value={description}
          autoComplete={false}
          label='Event Description'/>
        {/* Button */}
        <Button onPress={() => setDatePickerVisibility(true)}>
          {date ? date.toLocaleString() : "CHOOSE A DATE"}
        </Button>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode='datetime'
          onConfirm={date => handleConfirm(date)}
          onCancel={() => setDatePickerVisibility(false)}
        />
        {/* Button */}
        <Button onPress={pickImage}>
          {image ? "CHANGE IMAGE" : "CHOOSE AN IMAGE"}
        </Button>
        {/* Button */}
        <Button onPress={saveEvent}>
         {isLoading && <ActivityIndicator/>}
          SAVE EVENT
        </Button>

        {/* Snackbar */}
        <Snackbar
          visible={visible}
          onDismiss={onDismissSnackBar}
          action={{
            label: 'Hide',
            onPress: () => setVisible(false)
          }}>
          Make sure all fields are filled!
          </Snackbar>
      </View>
    </>
  );
}
