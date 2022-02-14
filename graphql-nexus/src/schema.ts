import {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
  subscriptionField,
  subscriptionType,
  FieldResolver,
  booleanArg,
} from 'nexus'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from './context'

export const DateTime = asNexusMethod(DateTimeResolver, 'date')

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allUsers', {
      type: 'User',
      args: {
        query: stringArg(),
      },
      resolve: (_parent, _args, context: Context) => {
        console.log(context)
        return context.prisma.user.findMany({
          where: {
            OR: [
              {
                name: { contains: _args.query || '' },
              },
              {
                email: { contains: _args.query || '' },
              },
            ],
          },
        })
      },
    })

    t.nullable.list.nonNull.field('allPost', {
      type: 'Post',
      args: {
        query: stringArg(),
      },
      resolve: (parent, args, ctx) => {
        return ctx.prisma.post.findMany({
          where: {
            OR: [
              {
                title: { contains: args.query || '' },
              },
              {
                body: { contains: args.query || '' },
              },
            ],
          },
        })
      },
    })

    t.nullable.field('postById', {
      type: 'Post',
      args: {
        id: intArg(),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.post.findUnique({
          where: { id: args.id || undefined },
        })
      },
    })

    // t.nonNull.list.nonNull.field('feed', {
    //   type: 'Post',
    //   args: {
    //     searchString: stringArg(),
    //     skip: intArg(),
    //     take: intArg(),
    //     orderBy: arg({
    //       type: 'PostOrderByUpdatedAtInput',
    //     }),
    //   },
    //   resolve: (_parent, args, context: Context) => {
    //     const or = args.searchString
    //       ? {
    //           OR: [
    //             { title: { contains: args.searchString } },
    //             { content: { contains: args.searchString } },
    //           ],
    //         }
    //       : {}

    //     return context.prisma.post.findMany({
    //       where: {
    //         published: true,
    //         ...or,
    //       },
    //       take: args.take || undefined,
    //       skip: args.skip || undefined,
    //       orderBy: args.orderBy || undefined,
    //     })
    //   },
    // })

    t.list.field('draftsByUser', {
      type: 'Post',
      args: {
        userUniqueInput: nonNull(
          arg({
            type: 'UserUniqueInput',
          }),
        ),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: {
              id: args.userUniqueInput.id || undefined,
              email: args.userUniqueInput.email || undefined,
            },
          })
          .posts({
            where: {
              published: false,
            },
          })
      },
    }),
      t.list.field('comments', {
        type: 'Comment',
        args: {},
        resolve: (parent, args, context) => {
          return context.prisma.comment.findMany()
        },
      })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.nonNull.field('signupUser', {
      type: 'User',
      args: {
        data: nonNull(
          arg({
            type: 'UserCreateInput',
          }),
        ),
      },
      resolve: (_, args, context: Context) => {
        const postData = args.data.posts?.map((post) => {
          return { title: post.title, body: post.body || undefined }
        })
        const user = context.prisma.user.create({
          data: {
            name: args.data.name,
            email: args.data.email,
            posts: {
              create: postData,
            },
          },
        })
        return user
      },
    })

    t.field('deleteUser', {
      type: 'User',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context) => {
        const user = context.prisma.user.findUnique({ where: { id: args.id } })
        context.prisma.user.delete({ where: { id: args.id } })
        return user
      },
    })

    t.field('updateUser', {
      type: 'User',
      args: {
        id: nonNull(intArg()),
        name: stringArg(),
        email: stringArg(),
      },
      resolve: async (parent, args, context) => {
        // name can be null
        // email cannot be null
        const user = await context.prisma.user.findUnique({
          where: { id: args.id },
        })
        if (!user) throw new Error('not found user')
        if (args.name) user.name = args.name
        if (args.email) user.email = args.email

        return context.prisma.user.update({
          where: { id: args.id },
          data: user,
        })
      },
    })

    t.field('createDraft', {
      type: 'Post',
      args: {
        data: nonNull(
          arg({
            type: 'PostCreateInput',
          }),
        ),
        authorEmail: nonNull(stringArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.create({
          data: {
            title: args.data.title,
            body: args.data.body,
            author: {
              connect: { email: args.authorEmail },
            },
          },
        })
      },
    })

    t.field('togglePublishPost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: async (_, args, context: Context) => {
        try {
          const post = await context.prisma.post.findUnique({
            where: { id: args.id || undefined },
            select: {
              published: true,
            },
          })
          return context.prisma.post.update({
            where: { id: args.id || undefined },
            data: { published: !post?.published },
          })
        } catch (e) {
          throw new Error(
            `Post with ID ${args.id} does not exist in the database.`,
          )
        }
      },
    })

    // t.field('incrementPostViewCount', {
    //   type: 'Post',
    //   args: {
    //     id: nonNull(intArg()),
    //   },
    //   resolve: (_, args, context: Context) => {
    //     return context.prisma.post.update({
    //       where: { id: args.id || undefined },
    //       data: {
    //         viewCount: {
    //           increment: 1,
    //         },
    //       },
    //     })
    //   },
    // })

    t.field('deletePost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.delete({
          where: { id: args.id },
        })
      },
    }),

    t.field("updatePost", {
      type: Post,
      args: {
        id: nonNull(intArg()),
        title: stringArg(),
        body: stringArg(),
        published: booleanArg()
      }, 
      resolve: async (parent, args, context) => {
        const post = await context.prisma.post.findUnique({where: {id: args.id}})
        if (!post) throw new Error("not found post")
        if (args.title) post.title = args.title
        if (args.body) post.body = args.body
        if (args.published != undefined && args.published !== null) post.published = args.published
        return context.prisma.post.update({where: {id: args.id}, data: post})
      }
    })

      // create comment
      t.field('createComment', {
        type: 'Comment',
        args: {
          text: nonNull(stringArg()),
          postId: nonNull(intArg()),
          authorEmail: nonNull(stringArg()),
        },
        resolve: (parent, args, context) => {
          return context.prisma.comment.create({
            data: {
              text: args.text,
              post: {
                connect: { id: args.postId },
              },
              author: {
                connect: { email: args.authorEmail },
              },
            },
          })
        },
      })
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
    t.nonNull.list.nonNull.field('posts', {
      type: 'Post',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .posts()
      },
    })
    t.nonNull.list.nonNull.field('comments', {
      type: 'Comment',
      resolve: (parent, _, ctx) => {
        return ctx.prisma.user
          .findUnique({ where: { id: parent.id || undefined } })
          .comments()
      },
    })
  },
})

const Post = objectType({
  name: 'Post',
  definition(t) {
    t.nonNull.int('id')
    // t.nonNull.field('createdAt', { type: 'DateTime' })
    // t.nonNull.field('updatedAt', { type: 'DateTime' })
    t.nonNull.string('title')
    t.string('body')
    t.nonNull.boolean('published')
    // t.nonNull.int('viewCount')
    t.field('author', {
      type: User,
      resolve: (parent, _, context: Context) => {
        return context.prisma.post
          .findUnique({ where: { id: parent.id } })
          .author()
      },
    }),
      t.nonNull.list.nonNull.field('comments', {
        type: 'Comment',
        resolve: (parent, args, ctx) => {
          return ctx.prisma.post
            .findUnique({ where: { id: parent.id } })
            .comments()
        },
      })
  },
})

const Comment = objectType({
  name: 'Comment',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.string('text')
    t.field('author', {
      type: 'User',
      resolve: (parent, _, context) => {
        return context.prisma.comment
          .findUnique({ where: { id: parent.id } })
          .author()
      },
    })
    t.field('post', {
      type: 'Post',
      resolve: (parent, _, context) => {
        return context.prisma.comment
          .findUnique({ where: { id: parent.id } })
          .post()
      },
    })
  },
})

const SortOrder = enumType({
  name: 'SortOrder',
  members: ['asc', 'desc'],
})

// const PostOrderByUpdatedAtInput = inputObjectType({
//   name: 'PostOrderByUpdatedAtInput',
//   definition(t) {
//     t.nonNull.field('updatedAt', { type: 'SortOrder' })
//   },
// })

const UserUniqueInput = inputObjectType({
  name: 'UserUniqueInput',
  definition(t) {
    t.int('id')
    t.string('email')
  },
})

const PostCreateInput = inputObjectType({
  name: 'PostCreateInput',
  definition(t) {
    t.nonNull.string('title')
    t.string('body')
  },
})

const UserCreateInput = inputObjectType({
  name: 'UserCreateInput',
  definition(t) {
    t.nonNull.string('email')
    t.string('name')
    t.list.nonNull.field('posts', { type: 'PostCreateInput' })
  },
})

// const CommentCreateInput = inputObjectType({
//   name: "CommentCreateInput",
//   definition(t) {
//     t.nonNull.string('text')

//   }
// })

// apollo team not recommend to use PubSub in server app. If you needed you have to use other libraries eg. GraphQL-Redis-Subscription, Postgres-subscription, etc instead
// subscription
// const Subscription = subscriptionType({
//   definition(t) {
//     t.boolean("isCreateUser", {
//       subscribe(root, args, ctx) {
//         return () => nexusAsyn
//       }
//     })
//   }
// })

export const schema = makeSchema({
  types: [
    Query,
    Mutation,
    Post,
    User,
    Comment,
    UserUniqueInput,
    UserCreateInput,
    PostCreateInput,
    SortOrder,
    // PostOrderByUpdatedAtInput,
    DateTime,
    // Subscription
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})
