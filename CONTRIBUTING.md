# Contributing to MaatWork CRM

Thank you for your interest in contributing to MaatWork CRM!

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Use the bug report template
3. Include steps to reproduce, expected behavior, and actual behavior
4. Include relevant screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Describe the feature in detail
3. Explain why this feature would be valuable
4. Include mockups or examples if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Write tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Gigisanta/MaatWorkCRM.git
cd MaatWorkCRM

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example apps/web/.env

# Setup database
cd apps/web
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

## Coding Standards

- Use TypeScript for all new code
- Follow Biome linting rules (`pnpm lint`)
- Write meaningful commit messages
- Keep functions small and focused
- No comments unless absolutely necessary (complex algorithms, security)
- No type suppression (`as any`, `@ts-ignore`)

## Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint code
pnpm lint
pnpm lint:fix
```

## Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove)
- Keep the first line under 72 characters
- Reference issues when applicable

## Review Process

1. All submissions require review
2. Address feedback promptly
3. Make requested changes
4. Ensure CI passes

## Questions?

For questions about contributing, please open a discussion or reach out to the maintainers.
