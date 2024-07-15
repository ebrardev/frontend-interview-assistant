"use client"
import React, { useEffect, useState } from "react";
import { TextField, Button, Container, Grid, LinearProgress } from "@mui/material";
import Message from "./Message";
import OpenAI from "openai";
import { MessageDto } from "../models/MessageDto";

const Chat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(new Array<MessageDto>());
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);
  const [isStop, setIsStop] = useState<boolean>(false);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: "Frontend mülakat asistanına hoşgeldiniz, hangi teknoloji hakkında konuşmak istersiniz ?(html,css,javascript,frameworks) ",
        isUser: false,
      },
    ]);
  }, [assistant]);

  const initChatBot = async () => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID;

    if (!apiKey) {
      throw new Error("API key is not defined in environment variables");
    }
    
    if (!assistantId) {
      throw new Error("Assistant ID is not defined in environment variables");
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Retrieve an existing assistant by ID
    const assistant = await openai.beta.assistants.retrieve(assistantId);

    // Create a thread
    const thread = await openai.beta.threads.create();

    setOpenai(openai);
    setAssistant(assistant);
    setThread(thread);
  };

  const createNewMessage = (content: string, isUser: boolean) => {
    const newMessage = new MessageDto(isUser, content);
    return newMessage;
  };

  const handleSendMessage = async () => {
    messages.push(createNewMessage(input, true));
    setMessages([...messages]);
    setInput("");

    // Send a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // Create a response
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    // Wait for the response to be ready
    while (response.status === "in_progress" || response.status === "queued") {
      console.log("waiting...");
      setIsWaiting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    setIsWaiting(false);

    // Get the messages for the thread
    const messageList = await openai.beta.threads.messages.list(thread.id);

    // Find the last message for the current run
    const lastMessage = messageList.data
      .filter((message: any) => message.run_id === run.id && message.role === "assistant")
      .pop();

    // Print the last message coming from the assistant
    if (lastMessage) {
      console.log(lastMessage.content[0]["text"].value);
      setMessages([...messages, createNewMessage(lastMessage.content[0]["text"].value, false)]);
    }
  };

  // Detect enter key and send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Container>
      <Grid container direction="column" spacing={2} paddingBottom={5}>
        {messages.map((message, index) => (
          <Grid item alignSelf={message.isUser ? "flex-end" : "flex-start"} key={index}>
            <Message key={index} message={message} />
          </Grid>
        ))}
        <Grid item>
          <TextField
            label="Mesajınızı giriniz"
            variant="outlined"
            disabled={isWaiting}
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            InputProps={{
              style: { color: "white" },
          
            }}
          />
          {isWaiting && <LinearProgress color="inherit" />}
        </Grid>
        {!isWaiting && (
          <Grid item>
            <Button variant="contained" color="primary" onClick={handleSendMessage} disabled={isWaiting}>
              Gönder
            </Button>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Chat;
