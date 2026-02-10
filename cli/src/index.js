import inquirer from "inquirer";
import dotenv from "dotenv";
import { printTitle } from "./helpers.js";
import { doesEnvFileExist, generateEnv, testEnvFile } from "./envGenerator.js";
import { newEnvQuestions } from "./questions/newEnvQuestions.js";
import { existingEnvQuestions } from "./questions/existingEnvQuestions.js";
import { spawn, spawnSync } from "child_process";
import chalk from "chalk";

const resolveDockerComposeCommand = () => {
  const hasDockerComposeV1 = spawnSync("docker-compose", ["version"], {
    stdio: "ignore",
  }).status === 0;

  if (hasDockerComposeV1) {
    return { command: "docker-compose", args: ["up", "--build"] };
  }

  const hasDockerComposeV2 =
    spawnSync("docker", ["compose", "version"], { stdio: "ignore" }).status === 0;

  if (hasDockerComposeV2) {
    return { command: "docker", args: ["compose", "up", "--build"] };
  }

  return null;
};

const handleExistingEnv = () => {
  console.log(chalk.yellow("Existing ./next/env file found. Validating..."));

  try {
    testEnvFile();
  } catch (e) {
    console.log(e.message);
    return;
  }

  inquirer.prompt(existingEnvQuestions).then((answers) => {
    handleRunOption(answers.runOption);
  });
};

const handleNewEnv = () => {
  inquirer.prompt(newEnvQuestions).then((answers) => {
    dotenv.config({ path: "./.env" });
    generateEnv(answers);
    console.log("\nEnv files successfully created!");
    handleRunOption(answers.runOption);
  });
};

const handleRunOption = (runOption) => {
  if (runOption === "docker-compose") {
    const dockerComposeCommand = resolveDockerComposeCommand();

    if (!dockerComposeCommand) {
      console.log(
        chalk.red(
          "Docker Compose was not found. Install Docker Desktop and ensure either `docker-compose` or `docker compose` is available."
        )
      );
      return;
    }

    const dockerComposeUp = spawn(
      dockerComposeCommand.command,
      dockerComposeCommand.args,
      {
        stdio: "inherit",
      }
    );

    dockerComposeUp.on("error", (error) => {
      console.log(chalk.red(`Failed to run Docker Compose: ${error.message}`));
    });
  }

  if (runOption === "manual") {
    console.log(
      "Please go into the ./next folder and run `npm install && npm run dev`."
    );
    console.log(
      "Please also go into the ./platform folder and run `poetry install && poetry run python -m reworkd_platform`."
    );
    console.log(
      "Please use or update the MySQL database configuration in the env file(s)."
    );
  }
};

printTitle();

if (doesEnvFileExist()) {
  handleExistingEnv();
} else {
  handleNewEnv();
}
