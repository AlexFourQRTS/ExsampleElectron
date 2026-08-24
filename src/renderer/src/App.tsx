import React, { useState } from 'react'
import { Button, Container, Typography, Box } from '@mui/material'

export default function App(): JSX.Element {
  const [response, setResponse] = useState<string>('')

  const handlePing = async () => {
    try {
      // Локальная типизация прямо здесь, в момент вызова
      const bridge = (window as unknown as { api: { ping: () => Promise<string> } }).api
      const res = await bridge.ping()
      setResponse(res)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Electron + React + MUI + TS
        </Typography>
        <Button variant="contained" color="primary" onClick={handlePing} sx={{ mb: 2 }}>
          Проверить IPC (Ping)
        </Button>
        {response && (
          <Typography variant="body1" color="textSecondary">
            Ответ: {response}
          </Typography>
        )}
      </Box>
    </Container>
  )
}