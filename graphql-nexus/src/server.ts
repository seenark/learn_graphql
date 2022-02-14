import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import http from 'http'
import { schema } from './schema'
import { context } from './context'

async function startApolloServer() {
  const app = express()
  const httpServer = http.createServer(app)

  const server = new ApolloServer({
    schema: schema,
    context: context,
    introspection: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })
  await server.start()
  server.applyMiddleware({ app });
  await new Promise<void>(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
startApolloServer()

