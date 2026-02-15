import { Unit } from './types';

export const UNITS: Unit[] = [
  {
    id: 'two-sum',
    title: 'Two Sum & Hash Maps',
    description: 'Learn how to trade space for time using Hash Maps.',
    icon: 'Hash',
    lesson: {
      title: 'The Power of Hash Maps',
      slides: [
        {
          id: 'slide-1',
          type: 'concept',
          title: 'The Brute Force Problem',
          content: 'Imagine you need to find two numbers in a list that add up to a target. Checking every pair takes O(n²) time. That\'s slow! As the list grows, the time explodes.',
        },
        {
          id: 'slide-2',
          type: 'analogy',
          title: 'The "Library" Analogy',
          content: 'Searching a library book-by-book is O(n). But if you have a catalog (Hash Map) that tells you exactly where a book is, lookup becomes O(1). We can use this to remember numbers we\'ve seen.',
        },
        {
          id: 'slide-3',
          type: 'code',
          title: 'Python Dictionary',
          content: 'In Python, a dictionary `dict` is a Hash Map. It gives us instant access to values.',
          codeSnippet: `seen = {}\nseen[5] = True\n\nif 5 in seen:\n    print("Found it instantly!")`
        }
      ]
    },
    toyExample: {
      title: 'Toy: Find the Complement',
      description: 'Given a list of numbers `nums` and a `target`, for each number `x`, check if `target - x` is already in our magic `seen` dictionary. If it is, return True. If not, add `x` to `seen`. Return False if no pair is found.',
      starterCode: `def has_pair_with_sum(nums, target):
    seen = {}
    for x in nums:
        complement = target - x
        # TODO: Check if complement is in seen
        # If yes, return True
        # If no, add x to seen
        pass
    return False`,
      solution: `def has_pair_with_sum(nums, target):
    seen = {}
    for x in nums:
        complement = target - x
        if complement in seen:
            return True
        seen[x] = True
    return False`,
      testHarness: `
def run_tests():
    tests = [
        ([2, 7, 11, 15], 9, [0, 1]),
        ([3, 2, 4], 6, [1, 2]),
        ([3, 3], 6, [0, 1]),
    ]
    results = []
    for nums, target, expected in tests:
        try:
            got = twoSum(nums, target)
            results.append({
                "input": f"nums={nums}, target={target}",
                "expected": str(expected),
                "actual": str(got),
                "passed": got == expected
            })
        except Exception as e:
            results.append({
                "input": f"nums={nums}, target={target}",
                "expected": str(expected),
                "actual": "Error",
                "passed": False,
                "error": str(e)
            })
    return results
`
    },
    mainProblem: {
      title: 'Two Sum',
      difficulty: 'Easy',
      patterns: ['Hash Map', 'Array'],
      externalLink: 'https://leetcode.com/problems/two-sum/'
    },
    parsons: {
      title: 'Construct the Two Sum Solution',
      description: 'Drag the blocks to form a correct O(n) solution for Two Sum and fill in the blanks.',
      blocks: [
        { id: 'p1', text: 'def twoSum(nums, target):', indent: 0, isBlank: false },
        { id: 'p2', text: 'prevMap = {}', indent: 1, isBlank: false },
        { id: 'p3', text: 'for i, n in enumerate(nums):', indent: 1, isBlank: false },
        { id: 'p4', text: '', indent: 2, isBlank: true, placeholder: 'calculate the complement' },
        { id: 'p5', text: 'if diff in prevMap:', indent: 2, isBlank: false },
        { id: 'p6', text: '', indent: 3, isBlank: true, placeholder: 'return both indices' },
        { id: 'p7', text: 'prevMap[n] = i', indent: 2, isBlank: false },
      ],
      solution_order: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
      segments: [
        { id: 'p1', code: 'def twoSum(nums, target):', indent: 0 },
        { id: 'p2', code: 'prevMap = {} # val -> index', indent: 1 },
        { id: 'p3', code: 'for i, n in enumerate(nums):', indent: 1 },
        { id: 'p4', code: 'diff = target - n', indent: 2 },
        { id: 'p5', code: 'if diff in prevMap:', indent: 2 },
        { id: 'p6', code: 'return [prevMap[diff], i]', indent: 3 },
        { id: 'p7', code: 'prevMap[n] = i', indent: 2 },
        { id: 'd1', code: 'for j in range(i + 1, len(nums)):', indent: 2, isDistractor: true },
        { id: 'd2', code: 'if nums[i] + nums[j] == target:', indent: 3, isDistractor: true }
      ]
    },
    flashcards: [
      { id: 'fc-1', unitId: 'two-sum', front: 'Time Complexity of Two Sum with Hash Map', back: 'O(n)' },
      { id: 'fc-2', unitId: 'two-sum', front: 'Space Complexity of Two Sum with Hash Map', back: 'O(n)' },
      { id: 'fc-3', unitId: 'two-sum', front: 'Why use enumerate() in Python?', back: 'To get both the index and value while looping.' }
    ],
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] }
    ],
    visualizationSteps: [
      {
        stepNumber: 1,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [],
        pointers: {},
        variables: { target: 9, prevMap: {} },
        message: 'Initialize empty hash map. Our target sum is 9.'
      },
      {
        stepNumber: 2,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [0],
        pointers: { i: 0 },
        variables: { target: 9, n: 2, diff: 7, prevMap: {} },
        message: 'Check index 0: n=2. Calculate diff = 9-2 = 7. Is 7 in prevMap? No.'
      },
      {
        stepNumber: 3,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [0],
        pointers: { i: 0 },
        variables: { target: 9, prevMap: { '2': 0 } },
        message: 'Add 2→0 to prevMap. prevMap = {2: 0}'
      },
      {
        stepNumber: 4,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [1],
        pointers: { i: 1 },
        variables: { target: 9, n: 7, diff: 2, prevMap: { '2': 0 } },
        message: 'Check index 1: n=7. Calculate diff = 9-7 = 2. Is 2 in prevMap? YES!'
      },
      {
        stepNumber: 5,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [0, 1],
        pointers: { i: 1, diff_index: 0 },
        variables: { target: 9, result: [0, 1] },
        message: 'Found! diff=2 was at index 0. Return [prevMap[2], 1] = [0, 1]'
      },
      {
        stepNumber: 6,
        visualizationType: 'array',
        data: [2, 7, 11, 15],
        highlighted: [0, 1],
        pointers: {},
        variables: { result: [0, 1] },
        message: 'Solution complete! nums[0] + nums[1] = 2 + 7 = 9 ✓'
      }
    ]
  },
  {
    id: 'valid-parens',
    title: 'Valid Parentheses & Stacks',
    description: 'Master the LIFO (Last-In, First-Out) property of Stacks.',
    icon: 'Layers',
    lesson: {
      title: 'Stacks Explained',
      slides: [
        {
          id: 'slide-1',
          type: 'concept',
          title: 'Last-In, First-Out',
          content: 'Think of a stack of plates. You can only add a plate to the top, and you can only remove the top plate. This is LIFO.',
        },
        {
          id: 'slide-2',
          type: 'analogy',
          title: 'Matching Brackets',
          content: 'When you see an opening bracket `(`, `[`, `{`, it waits for a match. We "push" it onto the stack. When we see a closer `)`, `]`, `}`, we "pop" the last opener to check if it matches.',
        },
        {
          id: 'slide-3',
          type: 'code',
          title: 'Python List as Stack',
          content: 'Python lists are perfect stacks. `append()` pushes, and `pop()` pops from the end.',
          codeSnippet: `stack = []\nstack.append('(')\ntop = stack.pop()\nprint(top) # '('`
        }
      ]
    },
    toyExample: {
      title: 'Toy: Simple Bracket Matcher',
      description: 'Write a function that checks if a string of ONLY round brackets `(` and `)` is valid. Use a counter or a stack.',
      starterCode: `def is_valid_simple(s):
    # Try using a counter.
    # +1 for '(', -1 for ')'.
    # If counter goes negative, return False.
    # At end, counter must be 0.
    balance = 0
    for char in s:
        pass
    return False`,
      solution: `def is_valid_simple(s):
    balance = 0
    for char in s:
        if char == '(':
            balance += 1
        else:
            balance -= 1
        if balance < 0:
            return False
    return balance == 0`,
      testHarness: `
def run_tests():
    tests = [
        ("()", True),
        ("()[]{}", True),
        ("(]", False),
        ("([)]", False),
        ("{[]}", True)
    ]
    results = []
    for s, expected in tests:
        try:
            got = isValid(s)
            results.append({
                "input": f"s='{s}'",
                "expected": str(expected),
                "actual": str(got),
                "passed": got == expected
            })
        except Exception as e:
            results.append({
                "input": f"s='{s}'",
                "expected": str(expected),
                "actual": "Error",
                "passed": False,
                "error": str(e)
            })
    return results
`
    },
    mainProblem: {
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      patterns: ['Stack', 'String'],
      externalLink: 'https://leetcode.com/problems/valid-parentheses/'
    },
    parsons: {
      title: 'Construct Valid Parentheses',
      description: 'Build the stack-based solution for handling multiple bracket types.',
      blocks: [
        { id: 'p1', text: 'def isValid(s):', indent: 0, isBlank: false },
        { id: 'p2', text: 'stack = []', indent: 1, isBlank: false },
        { id: 'p3', text: '', indent: 1, isBlank: true, placeholder: 'create bracket mapping dict' },
        { id: 'p4', text: 'for char in s:', indent: 1, isBlank: false },
        { id: 'p5', text: 'if char in mapping:', indent: 2, isBlank: false },
        { id: 'p6', text: 'top = stack.pop() if stack else "#"', indent: 3, isBlank: false },
        { id: 'p7', text: '', indent: 3, isBlank: true, placeholder: 'check if brackets match, return False if not' },
        { id: 'p8', text: 'else: stack.append(char)', indent: 2, isBlank: false },
        { id: 'p9', text: 'return not stack', indent: 1, isBlank: false },
      ],
      solution_order: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'],
      segments: [
        { id: 'p1', code: 'def isValid(s):', indent: 0 },
        { id: 'p2', code: 'stack = []', indent: 1 },
        { id: 'p3', code: 'mapping = {")":"(", "}":"{", "]":"["}', indent: 1 },
        { id: 'p4', code: 'for char in s:', indent: 1 },
        { id: 'p5', code: 'if char in mapping:', indent: 2 },
        { id: 'p6', code: 'top = stack.pop() if stack else "#"', indent: 3 },
        { id: 'p7', code: 'if mapping[char] != top: return False', indent: 3 },
        { id: 'p8', code: 'else: stack.append(char)', indent: 2 },
        { id: 'p9', code: 'return not stack', indent: 1 },
        { id: 'd1', code: 'if char == "(": stack.append(char)', indent: 2, isDistractor: true }
      ]
    },
    flashcards: [
      { id: 'fc-4', unitId: 'valid-parens', front: 'Time Complexity of Valid Parentheses', back: 'O(n)' },
      { id: 'fc-5', unitId: 'valid-parens', front: 'Space Complexity of Valid Parentheses', back: 'O(n) for the stack' },
      { id: 'fc-6', unitId: 'valid-parens', front: 'What data structure implements LIFO?', back: 'Stack' }
    ],
    testCases: [
      { input: ['()'], expected: true },
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
      { input: ['([)]'], expected: false },
      { input: ['{[]}'], expected: true }
    ],
    visualizationSteps: [
      {
        stepNumber: 1,
        visualizationType: 'stack',
        data: [],
        highlighted: [],
        pointers: {},
        variables: { input: '([{}])', index: 0 },
        message: 'Start with empty stack. Input: "([{}])"'
      },
      {
        stepNumber: 2,
        visualizationType: 'stack',
        data: ['('],
        highlighted: [0],
        pointers: { top: 0 },
        variables: { input: '([{}])', index: 0, char: '(' },
        message: 'See "(" - it\'s an opener, push to stack.'
      },
      {
        stepNumber: 3,
        visualizationType: 'stack',
        data: ['(', '['],
        highlighted: [1],
        pointers: { top: 1 },
        variables: { input: '([{}])', index: 1, char: '[' },
        message: 'See "[" - it\'s an opener, push to stack.'
      },
      {
        stepNumber: 4,
        visualizationType: 'stack',
        data: ['(', '[', '{'],
        highlighted: [2],
        pointers: { top: 2 },
        variables: { input: '([{}])', index: 2, char: '{' },
        message: 'See "{" - it\'s an opener, push to stack.'
      },
      {
        stepNumber: 5,
        visualizationType: 'stack',
        data: ['(', '['],
        highlighted: [1],
        pointers: { top: 1 },
        variables: { input: '([{}])', index: 3, char: '}', popped: '{' },
        message: 'See "}" - pop "{" from stack. They match! ✓'
      },
      {
        stepNumber: 6,
        visualizationType: 'stack',
        data: ['('],
        highlighted: [0],
        pointers: { top: 0 },
        variables: { input: '([{}])', index: 4, char: ']', popped: '[' },
        message: 'See "]" - pop "[" from stack. They match! ✓'
      },
      {
        stepNumber: 7,
        visualizationType: 'stack',
        data: [],
        highlighted: [],
        pointers: {},
        variables: { input: '([{}])', index: 5, char: ')', popped: '(' },
        message: 'See ")" - pop "(" from stack. They match! ✓'
      },
      {
        stepNumber: 8,
        visualizationType: 'stack',
        data: [],
        highlighted: [],
        pointers: {},
        variables: { result: true },
        message: 'Stack is empty. All brackets matched! Return True.'
      }
    ]
  }
];
