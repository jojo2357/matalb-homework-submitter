%% Advanced MATLAB Script
% We will be going over more advanced matlab topics and how they are
% displayed

%% Making a table
% Not much to see here, fairly simple

x = linspace(0, 25, 20);
calculated_cosine = cosine(x);

% this table is output in markdown form so you should probably go use a
% markdown renderer if it needs to be pretty
fprintf("| x | cos(x) |\n");
fprintf("|---|---|\n");

for i = 1:length(x)
    fprintf("| %.4f | %.4f |\n", x(i), calculated_cosine(i));
end

%% Making a chart
% Lets chart it!

plot(x,calculated_cosine);

%% Different plotting styles
% That was trash, lets see if log scale is better

yyaxis left
plot(x,calculated_cosine);

% we will add one so that the cosine is always positive and thus can be
% plotted
yyaxis right
semilogy(x,1+calculated_cosine);

%% Add more x values
% maybe if we did a bigger |linspace| it would work

x = linspace(0, 25, 2000);
calculated_cosine = cosine(x);

%% Replotting
% Now we will re-plot with the new x values

yyaxis left
plot(x,calculated_cosine);

% we will add one so that the cosine is always positive and thus can be
% plotted
yyaxis right
semilogy(x,1+calculated_cosine);

%% Functions
% Here follows some helper functions.

%%
% <latex>
% \subsubsection*{cosine}
% </latex>
%
% We include that since we want it to show up underneath the functions
% subsection. Anyway this function is a wrapper for the cosine function.
% Totally useless but I included it for demo purposes
function Y = cosine(x)
    Y = cos(x);
end

%% Conclusion
% Thanks for playing. Remember to like an subscribe.
