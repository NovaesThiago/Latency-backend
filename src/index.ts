import { createServer } from 'http';
import { app } from './app';
import { env } from './config/env';
import { initInvasionGateway } from './realtime/invasionGateway';

const httpServer = createServer(app);
initInvasionGateway(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Servidor rodando na porta ${env.port}`);
});
