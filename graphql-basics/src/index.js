import { GraphQLServer } from "graphql-yoga";
import { v4 as uuidv4 } from "uuid";

// Demo User
const users = [
  {
    id: "1",
    name: "HadesGod",
    email: "hadesgod@email.com",
    age: "30",
  },
  {
    id: "2",
    name: "TitonGod",
    email: "TitonGod@email.com",
  },
  {
    id: "3",
    name: "Kratos",
    email: "Kratos@email.com",
  },
];

// Demo Posts
const posts = [
  {
    id: "1",
    title: "Macbook Pro 2020 SoC M1",
    body: "This is the fastest notebook with ARM Chip",
    published: true,
    author: "1",
  },
  {
    id: "2",
    title: "iPhone12 Pro Max",
    body: "This is the fastest iphone apple ever made",
    published: true,
    author: "1",
  },
  {
    id: "3",
    title: "iPad Pro 2020",
    body: "This is the largest iPad size apple made",
    published: false,
    author: "2",
  },
];

// Demo Comments
const comments = [
  {
    id: "c1",
    text: "Accusam sit tempor diam consetetur.",
    author: "1",
    post: "3",
  },
  {
    id: "c2",
    text: "Et amet ipsum sed dolore kasd labore, at lorem et.",
    author: "1",
    post: "2",
  },
  {
    id: "c3",
    text: "He upon coffined ancient beyond bliss talethis the of. By.",
    author: "2",
    post: "2",
  },
  {
    id: "c4",
    text: "Schatten mein das menge versuch irrt und herz,.",
    author: "3",
    post: "1",
  },
];

// Type Definitions
const typeDefs = `
  type Query {
    users(query: String): [User!]!
    posts(query: String): [Post!]!
    comments: [Comment!]!
    me: User!
    post: Post!
  }

  type Mutation {
    createUser(name: String!, email: String!, age: Int): User! 
    createPost(title:String!, body:String!, published:Boolean!, author:ID!): Post!
    createComment(text: String!, author: ID!, post: ID!): Comment!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!
    comments: [Comment!]!
  }
  type Post {
    id: ID!
    title: String!
    body: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }
  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
  }

`;

// Resolvers
const resolvers = {
  Query: {
    users(parent, args, ctx, info) {
      if (!args.query) {
        return users;
      }
      return users.filter((user) => {
        return user.name.toLowerCase().includes(args.query.toLowerCase());
      });
    },
    posts(parent, args, ctx, info) {
      if (!args.query) {
        return posts;
      }
      return posts.filter((post) => {
        const isTitleMatch = post.title
          .toLowerCase()
          .includes(args.query.toLowerCase());
        const isBodyMatch = post.body
          .toLowerCase()
          .includes(args.query.toLowerCase());
        return isTitleMatch || isBodyMatch;
      });
    },
    comments(parent, args, ctx, info) {
      return comments;
    },
    me() {
      return {
        id: "123456",
        name: "HadesGod",
        email: "hadesgod@mail.com",
        age: 29,
      };
    },
    post() {
      return {
        id: "abc123",
        title: "God's Bookds",
        body: "HadesGod body",
        published: true,
      };
    },
  },
  Mutation: {
    createUser(parent, args, ctx, info) {
      /** check is this email exist */
      const emailTaken = users.some((user) => user.email === args.email);
      if (emailTaken) {
        throw new Error("this email already taken.");
      }
      const user = {
        id: uuidv4(),
        name: args.name,
        email: args.email,
        age: args.age,
      };
      users.push(user);
      return user;
    },
    createPost(parent, args, ctx, info) {
      /** check if user exist can create the post */
      const userExist = users.some((user) => user.id === args.author);
      if (!userExist) {
        throw new Error("user does not exist");
      }
      const post = {
        id: uuidv4(),
        title: args.title,
        body: args.body,
        published: args.published,
        author: args.author,
      };
      posts.push(post);
      return post;
    },
    createComment(parent, args, ctx, info) {
      /** check is user exist */
      const userExist = users.some((user) => user.id === args.author);
      if (!userExist) throw new Error("user does not exist");
      /** check is post exist and published is true */
      const postExist = posts.some((post) => {
        return post.id === args.post && post.published === true;
      });
      if (!postExist)
        throw new Error("post does not exist or post unpublished");
      const comment = {
        id: uuidv4(),
        text: args.text,
        author: args.author,
        post: args.post,
      };
      comments.push(comment);
      return comment;
    },
  },
  Post: {
    author(parent, args, ctx, info) {
      return users.find((user) => user.id === parent.author);
    },
    comments(parent, args, ctx, info) {
      return comments.filter((comment) => comment.post === parent.id);
    },
  },
  User: {
    posts(parent, args, ctx, info) {
      return posts.filter((post) => {
        return post.author === parent.id;
      });
    },
    comments(parent, args, ctx, info) {
      return comments.filter((comment) => comment.author === parent.id);
    },
  },
  Comment: {
    author(parent, args, ctx, info) {
      return users.find((user) => user.id === parent.author);
    },
    post(parent, args, ctx, info) {
      return posts.find((post) => post.id === parent.post);
    },
  },
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
});

server.start(() => {
  console.log("Server is up");
});
