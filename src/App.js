import React, { useState, useEffect } from "react";
import { API, Storage, Auth } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';

// create
const listNotes = `query ListNotes {
  listNotes {
    items {
      id
      name
      description
      image
    }
  }
}`;

// edit
const createNoteMutation = `mutation CreateNote($input: CreateNoteInput!) {
  createNote(input: $input) {
    id
    name
    description
    image
  }
}`;

// delete
const deleteNoteMutation = `mutation DeleteNote($input: DeleteNoteInput!) {
  deleteNote(input: $input) {
    id
  }
}`;

// get notes
function App() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  // fetch notes
  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  // create notes
  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  // delete notes
  async function deleteNote({ id, name }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(name);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  const signOut = async () => {
    await Auth.signOut();
    setNotes([]);
  };
  

  // layout of the app
  return (
    <View className="App">

      <Heading level={1}>My Notes App</Heading>

      <View as="form" margin="3rem 0" onSubmit={createNote}>

        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />

          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />

          <Button type="submit" variation="primary">
            Create Note
          </Button>

          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />

        </Flex>

      </View>

      <Heading level={2}>Current Notes</Heading>

      <View margin="3rem 0">

      {notes.map((note) => (
        <Flex
          key={note.id || note.name}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text as="strong" fontWeight={700}>
            {note.name}
          </Text>
          <Text as="span">{note.description}</Text>
          {note.image && (
            <Image
              src={note.image}
              alt={`visual aid for ${notes.name}`}
              style={{ width: 400 }}
            />
          )}
          <Button variation="link" onClick={() => deleteNote(note)}>
            Delete note
          </Button>
        </Flex>
      ))}
     </View>
     <Button onClick={signOut}>Sign Out</Button>
   </View>
 );
};

export default withAuthenticator(App);