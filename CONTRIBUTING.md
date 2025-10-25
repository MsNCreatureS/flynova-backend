# Contributing to FlyNova

Thank you for your interest in contributing to FlyNova! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- 🐛 **Report Bugs**: Found a bug? Let us know!
- 💡 **Suggest Features**: Have an idea? We'd love to hear it!
- 📝 **Improve Documentation**: Help make our docs better
- 🔧 **Submit Code**: Fix bugs or implement features
- 🎨 **Design**: Improve UI/UX
- 🌍 **Translations**: Help us go international

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/FlyNova.git
cd FlyNova
```

### 3. Set Up Development Environment

```bash
# Install dependencies
npm install

# Set up environment
node setup.js

# Run migrations
npm run migrate

# Import data
npm run import:data
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming convention:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

## 📝 Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments where necessary
- Update documentation if needed

### 2. Test Your Changes

```bash
# Test backend
npm run server:dev

# Test frontend
npm run dev

# Manual testing
# - Test all affected features
# - Check for console errors
# - Verify database changes
```

### 3. Commit Your Changes

```bash
git add .
git commit -m "Type: Brief description"
```

Commit message format:
```
Type: Brief description (max 50 chars)

Detailed explanation if needed (wrap at 72 chars)

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

Commit types:
- `Feat:` - New feature
- `Fix:` - Bug fix
- `Docs:` - Documentation changes
- `Style:` - Code style changes (formatting)
- `Refactor:` - Code refactoring
- `Test:` - Test additions/changes
- `Chore:` - Build/config changes

Example:
```bash
git commit -m "Feat: Add flight duration calculator

- Calculate flight duration based on distance
- Add estimated arrival time
- Update route display with duration

Fixes #42"
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create a Pull Request

1. Go to the original FlyNova repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template
5. Submit!

## 📋 Pull Request Guidelines

### PR Title Format

```
Type: Brief description
```

Examples:
- `Feat: Add real-time flight tracking map`
- `Fix: Resolve login token expiration issue`
- `Docs: Update deployment guide for Hostinger`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested locally
- [ ] All existing tests pass
- [ ] Added new tests (if applicable)

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Fixes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No breaking changes (or documented)
- [ ] Tested on multiple devices/browsers
```

## 💻 Code Style Guidelines

### JavaScript/TypeScript

```javascript
// Use const/let, not var
const userId = 1;
let status = 'active';

// Use async/await over callbacks
async function fetchData() {
  const data = await api.get('/data');
  return data;
}

// Use template literals
const message = `Hello ${username}!`;

// Use arrow functions
const users = data.map(item => item.user);

// Destructure when possible
const { id, name } = user;

// Use early returns
if (!user) return null;

// Add JSDoc comments for functions
/**
 * Calculate flight duration
 * @param {number} distance - Distance in nautical miles
 * @param {number} speed - Average speed in knots
 * @returns {number} Duration in minutes
 */
function calculateDuration(distance, speed) {
  return (distance / speed) * 60;
}
```

### Database Queries

```javascript
// Always use parameterized queries
const [users] = await db.query(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// NOT this (SQL injection risk):
// const query = `SELECT * FROM users WHERE id = ${userId}`;

// Use meaningful aliases
const [flights] = await db.query(`
  SELECT 
    f.id,
    f.flight_number,
    u.username as pilot_name,
    va.name as va_name
  FROM flights f
  JOIN users u ON f.user_id = u.id
  JOIN virtual_airlines va ON f.va_id = va.id
  WHERE f.status = ?
`, ['completed']);
```

### React/Next.js Components

```typescript
// Use TypeScript interfaces
interface Props {
  userId: number;
  onClose: () => void;
}

// Functional components with TypeScript
export default function UserProfile({ userId, onClose }: Props) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId);
  }, [userId]);
  
  return (
    <div className="profile">
      {/* Component JSX */}
    </div>
  );
}

// Use meaningful component names
// Good: UserProfileCard, FlightDetailsModal
// Bad: Component1, MyComponent
```

### CSS/Tailwind

```css
/* Use Tailwind utility classes */
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

/* For complex styles, use custom CSS classes */
.custom-gradient {
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
}

/* Mobile-first responsive design */
<div className="text-sm md:text-base lg:text-lg">
```

## 🗄️ Database Changes

### Adding Tables

1. Update `database/schema.sql`
2. Add migration in `server/migrations/`
3. Document the change
4. Update relevant API routes

### Adding Columns

```sql
-- In schema.sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Always include indexes if needed
CREATE INDEX idx_phone ON users(phone_number);
```

## 📚 Documentation Standards

### Code Comments

```javascript
// Single-line comment for simple explanations

/**
 * Multi-line comment for functions
 * Explain what it does, parameters, and return value
 */

// TODO: Add pagination support
// FIXME: Handle edge case when user is null
// NOTE: This query is optimized for performance
```

### API Documentation

When adding new endpoints, update `API.md`:

```markdown
### New Endpoint Name

**POST** `/api/new-endpoint`

Brief description of what it does.

**Request Body**:
\`\`\`json
{
  "field": "value"
}
\`\`\`

**Response** (200):
\`\`\`json
{
  "message": "Success"
}
\`\`\`
```

### README Updates

- Keep README.md up to date with new features
- Update installation steps if process changes
- Add new dependencies to Prerequisites
- Update project structure if it changes

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting PR:

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Works on different screen sizes
- [ ] Works in Chrome, Firefox, Safari
- [ ] Database changes work correctly
- [ ] No broken existing features
- [ ] API returns expected responses

### Writing Tests (Future)

```javascript
// Example unit test structure
describe('Flight Duration Calculator', () => {
  it('should calculate duration correctly', () => {
    const duration = calculateDuration(1000, 500);
    expect(duration).toBe(120); // 2 hours
  });
  
  it('should handle zero speed', () => {
    const duration = calculateDuration(1000, 0);
    expect(duration).toBe(Infinity);
  });
});
```

## 🐛 Bug Reports

### Before Reporting

1. Search existing issues
2. Try to reproduce on latest version
3. Test with minimal setup
4. Check troubleshooting guide

### Bug Report Template

```markdown
**Describe the Bug**
Clear description of what's wrong

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., 18.0.0]
- Database: [e.g., MySQL 8.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Mockups, examples, etc.
```

## ⚖️ Code of Conduct

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal or political attacks
- Spam or off-topic content

### Enforcement

Violations may result in:
- Warning
- Temporary ban
- Permanent ban

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Thanked in project documentation

## 📞 Questions?

- Open a discussion on GitHub
- Check existing documentation
- Ask in pull request comments

## 🎯 Priorities

Current priorities:
1. 🐛 Bug fixes
2. 📝 Documentation improvements
3. ✨ UI/UX enhancements
4. 🚀 Performance optimizations
5. 🌟 New features

## 🔄 Review Process

1. **Submission**: PR submitted
2. **Initial Review**: Maintainer checks format and completeness
3. **Code Review**: Detailed code review by maintainer
4. **Testing**: Changes tested locally
5. **Feedback**: Comments and requested changes
6. **Approval**: PR approved by maintainer
7. **Merge**: Changes merged into main branch

### Review Criteria

- Code quality and style
- Functionality and correctness
- Performance impact
- Security considerations
- Documentation completeness
- Test coverage

## 📅 Release Cycle

- **Minor releases**: Monthly (bug fixes, small features)
- **Major releases**: Quarterly (breaking changes, major features)

## 🎓 Learning Resources

New to contributing? Check out:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [First Contributions](https://github.com/firstcontributions/first-contributions)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

## Thank You! 🙌

Every contribution, no matter how small, makes FlyNova better. We appreciate your time and effort!

**Happy coding! ✈️**
