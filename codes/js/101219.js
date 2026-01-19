// package MP1;

public class mp1mirrorFlip {
    // This method will take a 2D char array as input and display it (print it onto the console). 
        // You will use this method to show the original image and the flipped images later on. 
        // You should be careful that each row is printed on a new line, but each column remains on 
        // the same line.

        private static void displayImage(char[][] photo) {//Kevin Orpeza assisted in the start along with chatgpt, to clean up the syntax
            for (int i = 0; i < photo.length; i++) {
                for (int j = 0; j < photo[i].length; j++) {
                    System.out.print(photo[i][j]);
                }
                System.out.println(); // switch lines after each row
        }
        System.out.println(); // a more organized look between lines to have a more better visual
        

    }

    /*
     * private static char[][] horizontalMirror(char[][] photo):
     * This method will perform the horizontal flip of the photo and
     * return the modified 2D array. Must work for any sized array.
     */
    private static char[][] horizontalMirror(char[][] photo) {
        int rows = photo.length;
        int cols = photo[0].length; // Ensure that all rows in the array have the same length
        char[][] photoThatIFlipped = new char[rows][cols];
    
        // a for loop to flip each horizontal row and copy it
        // "photoThatIFlipped[i][j] = photo[i][cols - j - 1];" used chatgpt to fill in the blanks
            // calculates the column index in photo that corresponds to the mirrored position of column j in photoThatIFlipped.
                // explanation taken from chatgpt, after asking it to fix my code and explain the change, MADE CLEAR TO ONLY FIX CODE NO
                // IRRELEVENT CODE WAS NOT ADD.
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                photoThatIFlipped[i][j] = photo[i][cols - j - 1];
            }
        }
        return photoThatIFlipped;
    }

    /*
     * private static char[][] verticalMirror(char[][] photo):
     * this method will perform the vertical flip of the photo and return the modified 2D array.
     * This method must work for any size array
     */
    private static char[][] verticalMirror(char[][] photo) {
        int rows = photo.length;
        int cols = photo[0].length;
        char[][] photoThatIFlipped = new char[rows][cols];

        // a for loop to flip each horizontal row and copy it
        // "photoThatIFlipped[i][j] = photo[rows - i - 1][j]
            // used the previous almost identical from above that was taken from the prompt i gave chatgpt to fix my code
            // (meaning from previous method)
            // the "[j]", also came from chatgpt
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                photoThatIFlipped[i][j] = photo[rows - i - 1][j];
            }
        }
        return photoThatIFlipped;
    }

    // The main method will be executed here
    public static void main(String[] args) {
        // "How do i hard code a 2d char array in my code and explain what it will do, and why we hard coded it" <- this is the prompt I used 
        // in order for chatgpt to assist me in coding this
        // the main method to test the functions 
            // this sentence was refrenced thanks to the CPSC 231 student Kevin Orpeza.
        /*
        Creating a 2D array with the same dimensions as was stated in our input "photo",
        reading every row "i" and column "j" of the input "photo"
        */ 
        char[][] photo = {
            {'#', 'x', '#', '#', '#'},
            {'#', '@', '@', '@', '#'},
            {'#', '@', 'E', '@', '#'},
            {'*', '@', '@', '|', '@'},
            {'#', '@', '@', '@', '#'},
            {'#', '@', '@', '@', '#'},
            {'#', '#', '#', 'y', '#'},
        };
        // print method will display the original image
        System.out.println("Display the original image:");
        displayImage(photo);

        // make the horizontal flip to the photo and display the output
        char[][] photoFlippedHorizontal = horizontalMirror(photo);
        System.out.println("The mirrored photo flipped horizontally:");
        displayImage(photoFlippedHorizontal);

        // make the vertical flip to the photo and display the output
        char[][] flippedImageFull = verticalMirror(photoFlippedHorizontal);
        System.out.println("The mirrored photo flipped both vertically and horizontally:");
        displayImage(flippedImageFull);
        }

        // "Please check for any errors and if this will run" <- last prompt used to ask chat if the code will run
    }