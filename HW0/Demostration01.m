%% Basic MATLAB Script
% This file demonstates how to use the tool and these comments. For more
% information visit:
%
% <latex>
% \href{https://www.mathworks.com/help/matlab/matlab_prog/marking-up-matlab-comments-for-publishing.html}{MathWorks
% docs}
% </latex>

%% Printing out pi
% Here we will show what happens when we print $\pi$ in different ways

pi
disp(pi)
fprintf("%.69f\n", pi);

%% Conclusion
% As you probably noticed, the result of running the previous section is
% displayed right below the code chunk. Now isnt that so nice?

"Good bye"
disp("Good bye")
% oh and by the way you can still add comments
fprintf("%.69f\n", "Good bye");
