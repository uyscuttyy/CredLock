# CredLock — Portable Financial Reputation Layer

CredLock turns verifiable on-chain financial activity into portable credentials for the Creditcoin ecosystem.

## Features

- Multi-chain activity discovery (Ethereum, Base, Arbitrum)
- Attestcoin verification integration
- Credential generation with freshness checks
- Public credential verification
- Real-time blockchain activity monitoring

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- viem + wagmi for blockchain interaction
- Attestcoin SDK

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Run `npm install`
4. Run `npx prisma db push` to set up the database
5. Run `npm run dev` to start the development server

## Documentation

See the full documentation in the repository for detailed setup instructions.