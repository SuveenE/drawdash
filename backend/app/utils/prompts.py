"""
Prompt templates for image generation and editing.
"""

GENERATE_PROMPT = """Generate a drawing image based on the following reference image of a drawing and the explanation by the user.
The image background should match the reference image background. You are just drawing diagrams, so make sure you are not over verbose.
But if there are paragraphs in the image, you should keep them there.

The main goal should be to create a diagram. If the components or items of the diagram is explained in the user voice explanation, you should item or component name them in the diagram.
User voice explanation: {user_prompt}"""

EDIT_PROMPT = """Edit the provided drawing image based on the user's explanation and instructions.
Maintain the overall structure and background of the original image while incorporating the requested changes.
Focus on modifying or enhancing specific elements as described by the user.

User edit instructions: {user_prompt}"""
